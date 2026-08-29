"""
Autenticación y vistas del portal del cliente.

Todos los endpoints bajo /api/portal/ están protegidos con PortalTokenAuthentication,
que valida el token contra ClientUser (no contra el User de Django).
"""
from django.conf import settings
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.authentication import BaseAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.billing.models import Invoice
from apps.payments.services import get_sdk
from apps.tickets.models import Ticket
from .models import ClientUser
from .serializers import (
    PortalMeSerializer,
    PortalInvoiceSerializer,
    PortalTicketSerializer,
    PortalTicketCreateSerializer,
)


# ---------------------------------------------------------------------------
# Autenticación propia del portal (tokens de ClientUser, no de Django User)
# ---------------------------------------------------------------------------

class PortalTokenAuthentication(BaseAuthentication):
    """
    Autenticación basada en tokens para ClientUser.
    Header esperado: Authorization: PortalToken <token>
    """

    def authenticate(self, request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('PortalToken '):
            return None

        token_key = auth.split(' ', 1)[1].strip()
        try:
            portal_token = PortalToken.objects.select_related('user').get(key=token_key)
        except PortalToken.DoesNotExist:
            raise AuthenticationFailed('Token de portal inválido o expirado.')

        if not portal_token.user.is_active:
            raise AuthenticationFailed('Usuario del portal inactivo.')

        return (portal_token.user, portal_token)

    def authenticate_header(self, request):
        return 'PortalToken realm="Portal skwisp"'


# ---------------------------------------------------------------------------
# Login del portal
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([AllowAny])
def portal_login(request):
    """
    POST /api/portal/auth/login/
    Body: { "rut": "12345678-9", "password": "..." }
    Response: { "token": "...", "client_name": "...", "status": "..." }
    """
    rut = request.data.get('rut', '').strip().upper()
    password = request.data.get('password', '')

    # Normalizar RUT (quitar puntos si los trae)
    rut = rut.replace('.', '').replace(' ', '')

    try:
        portal_user = ClientUser.objects.select_related('client').get(rut=rut)
    except ClientUser.DoesNotExist:
        return Response(
            {'detail': 'RUT o contraseña incorrectos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not portal_user.check_password(password):
        return Response(
            {'detail': 'RUT o contraseña incorrectos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not portal_user.is_active:
        return Response(
            {'detail': 'Portal de acceso deshabilitado. Contacta al ISP.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Actualizar último login
    portal_user.last_login = timezone.now()
    portal_user.save(update_fields=['last_login'])

    # Generar o recuperar token de portal
    token, _ = PortalToken.objects.get_or_create(user=portal_user)

    client = portal_user.client
    return Response({
        'token': token.key,
        'rut': portal_user.rut,
        'client_name': f'{client.first_name} {client.last_name}',
        'client_status': client.status,
        'plan_name': client.plan.name,
    })


# ---------------------------------------------------------------------------
# Vistas autenticadas del portal
# ---------------------------------------------------------------------------

class PortalMeView(generics.RetrieveAPIView):
    """GET /api/portal/me/ — Datos del cliente autenticado."""

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = PortalMeSerializer

    def get_object(self):
        return self.request.user


class PortalInvoiceListView(generics.ListAPIView):
    """GET /api/portal/invoices/ — Facturas del cliente, más recientes primero."""

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = PortalInvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(
            client=self.request.user.client
        ).order_by('-period_year', '-period_month')


@api_view(['POST'])
@authentication_classes([PortalTokenAuthentication])
@permission_classes([IsAuthenticated])
def portal_create_payment(request, pk):
    """
    POST /api/portal/invoices/{id}/pay/
    Genera una preferencia de pago en Mercado Pago y retorna la URL de pago.
    """
    client = request.user.client
    try:
        invoice = Invoice.objects.get(pk=pk, client=client)
    except Invoice.DoesNotExist:
        return Response({'detail': 'Factura no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if invoice.status not in ('pending', 'overdue'):
        return Response({'detail': 'Esta factura no está pendiente de pago.'}, status=status.HTTP_400_BAD_REQUEST)

    sdk = get_sdk()
    preference_data = {
        'items': [{
            'title': f'Servicio Internet {invoice.period_month}/{invoice.period_year}',
            'quantity': 1,
            'unit_price': float(invoice.amount),
            'currency_id': 'CLP',
        }],
        'external_reference': str(invoice.id),
        'back_urls': {
            'success': f'{settings.SITE_URL}/portal/invoices?payment=success',
            'failure': f'{settings.SITE_URL}/portal/invoices?payment=failure',
            'pending': f'{settings.SITE_URL}/portal/invoices?payment=pending',
        },
        'auto_return': 'approved',
        'payer': {
            'email': client.email,
            'name': client.first_name,
            'surname': client.last_name,
        },
        'statement_descriptor': 'skwisp ISP',
    }

    result = sdk.preference().create(preference_data)
    preference = result.get('response', {})

    if result.get('status') != 201:
        return Response(
            {'detail': 'No se pudo crear la preferencia de pago.', 'mp_error': preference},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        'preference_id': preference.get('id'),
        'init_point': preference.get('init_point'),        # URL de pago producción
        'sandbox_init_point': preference.get('sandbox_init_point'),  # URL de pago sandbox
    })


@api_view(['GET'])
@authentication_classes([PortalTokenAuthentication])
@permission_classes([IsAuthenticated])
def portal_download_pdf(request, pk):
    """
    GET /api/portal/invoices/{id}/pdf/
    Genera y retorna la boleta en formato PDF para el cliente actual.
    """
    from django.template.loader import render_to_string
    from django.http import HttpResponse
    import weasyprint

    client = request.user.client
    try:
        invoice = Invoice.objects.get(pk=pk, client=client)
    except Invoice.DoesNotExist:
        return Response({'detail': 'Factura no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    html_string = render_to_string('billing/invoice_pdf.html', {'invoice': invoice})
    pdf_file = weasyprint.HTML(string=html_string).write_pdf()

    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="boleta_{invoice.id}.pdf"'
    return response


class PortalTicketListView(generics.ListCreateAPIView):
    """
    GET  /api/portal/tickets/  — Lista de tickets del cliente.
    POST /api/portal/tickets/  — Crear nuevo ticket.
    """

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PortalTicketCreateSerializer
        return PortalTicketSerializer

    def get_queryset(self):
        return Ticket.objects.filter(
            client=self.request.user.client
        ).prefetch_related('comments__author').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            client=self.request.user.client,
            status='open',
        )


class PortalTicketDetailView(generics.RetrieveAPIView):
    """GET /api/portal/tickets/{id}/ — Detalle de un ticket con historial de comentarios."""

    authentication_classes = [PortalTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = PortalTicketSerializer

    def get_queryset(self):
        return Ticket.objects.filter(
            client=self.request.user.client
        ).prefetch_related('comments__author')


# ---------------------------------------------------------------------------
# Modelo de token del portal (tabla separada de los tokens de admin)
# ---------------------------------------------------------------------------

import secrets  # noqa: E402
from django.db import models as db_models  # noqa: E402

def generate_portal_token():
    return secrets.token_urlsafe(48)

class PortalToken(db_models.Model):
    """Token de autenticación para usuarios del portal de clientes."""

    key = db_models.CharField(max_length=64, unique=True, default=generate_portal_token)
    user = db_models.OneToOneField(ClientUser, on_delete=db_models.CASCADE, related_name='auth_token')
    created_at = db_models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'portal'

    def __str__(self):
        return f'Token portal: {self.user.rut}'
