from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from apps.billing.models import Invoice
from .models import Payment
from .services import get_sdk
from .webhook_security import validate_mp_signature

# payment_type_id que Mercado Pago SÍ cubre con el mecanismo de "voucher válido como
# boleta" (Resolución SII 176) — únicamente pagos con tarjeta. Todo lo demás
# (transferencia, dinero en cuenta MP, etc.) requiere boleta manual mientras no exista
# integración directa con el SII.
#
# IMPORTANTE: antes de confiar en esta lista en producción, verifica con un pago real
# de prueba (sandbox o real) por cada método qué valor exacto devuelve MP en
# payment_type_id — puede variar según el método específico habilitado en Chile.
MP_PAYMENT_TYPES_COVERED_BY_VOUCHER = {'credit_card', 'debit_card'}


@csrf_exempt
def mercadopago_webhook(request):
    if not validate_mp_signature(request, getattr(settings, 'MP_WEBHOOK_SECRET', '')):
        return JsonResponse({'error': 'invalid signature'}, status=401)

    payment_id = request.GET.get('data.id') or request.POST.get('data', {}).get('id')
    if not payment_id:
        return JsonResponse({'error': 'no payment id'}, status=400)

    sdk = get_sdk()
    mp_response = sdk.payment().get(payment_id)
    mp_data = mp_response['response']

    external_reference = mp_data.get('external_reference')
    status = mp_data.get('status')

    try:
        invoice = Invoice.objects.get(id=external_reference)
    except Invoice.DoesNotExist:
        return JsonResponse({'error': 'invoice not found'}, status=404)

    payment_type_id = mp_data.get('payment_type_id', '')
    requires_manual_boleta = (
        status == 'approved' and payment_type_id not in MP_PAYMENT_TYPES_COVERED_BY_VOUCHER
    )

    Payment.objects.update_or_create(
        mp_payment_id=payment_id,
        defaults={
            'invoice': invoice,
            'amount': mp_data.get('transaction_amount'),
            'method': 'mercadopago',
            'mp_status': status,
            'mp_payment_type': payment_type_id,
            'requires_manual_boleta': requires_manual_boleta,
            'raw_webhook_payload': mp_data,
        },
    )

    if status == 'approved' and invoice.status != 'paid':
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save()

        client = invoice.client
        if client.status == 'suspended':
            client.status = 'active'
            client.save()

    return JsonResponse({'status': 'ok'})


from django.utils import timezone as tz
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'invoice__client').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # GET /api/payments/?pending_manual_boleta=true — cola de trabajo para
        # cobranza: pagos por transferencia aún sin boleta manual emitida en el SII.
        if self.request.query_params.get('pending_manual_boleta') == 'true':
            qs = qs.filter(requires_manual_boleta=True, manual_boleta_issued=False)
        return qs

    @action(detail=True, methods=['post'])
    def mark_boleta_issued(self, request, pk=None):
        """
        POST /api/payments/{id}/mark_boleta_issued/
        Body: { "folio": "12345" }
        Marca el pago como ya facturado manualmente en el SII (proceso hoy externo
        al sistema). Punto de enganche para cuando exista integración directa con el
        SII: reemplazar esta acción manual por la llamada automática al proveedor DTE.
        """
        payment = self.get_object()
        if not payment.requires_manual_boleta:
            return Response(
                {'detail': 'Este pago no requiere boleta manual (cubierto por voucher MP).'},
                status=400,
            )
        payment.manual_boleta_issued = True
        payment.manual_boleta_number = request.data.get('folio', '')
        payment.manual_boleta_issued_at = tz.now()
        payment.manual_boleta_issued_by = request.user
        payment.save()
        return Response(PaymentSerializer(payment).data)
