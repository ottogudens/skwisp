from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.clients.models import Client
from apps.billing.models import Invoice
from apps.tickets.models import Ticket


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    today = timezone.now().date()

    monthly_revenue = (
        Invoice.objects.filter(
            status='paid', period_month=today.month, period_year=today.year
        ).values_list('amount', flat=True)
    )

    return Response({
        'active_clients': Client.objects.filter(status='active').count(),
        'suspended_clients': Client.objects.filter(status='suspended').count(),
        'pending_invoices': Invoice.objects.filter(status='pending').count(),
        'overdue_invoices': Invoice.objects.filter(status='overdue').count(),
        'open_tickets': Ticket.objects.filter(status__in=['open', 'in_progress']).count(),
        'monthly_revenue': sum(monthly_revenue) if monthly_revenue else 0,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Sin autenticación — usado por Railway/monitoreo para verificar que el servicio responde."""
    return Response({'status': 'ok'})
