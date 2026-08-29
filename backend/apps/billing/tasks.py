from celery import shared_task
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.utils import timezone

from apps.clients.models import Client
from .models import Invoice


@shared_task
def generate_monthly_invoices():
    today = timezone.now().date()
    clients_due = Client.objects.filter(
        status__in=['active', 'suspended'],
        billing_day=today.day,
    ).select_related('plan')

    created_count = 0
    for client in clients_due:
        due_date = today + relativedelta(days=settings.BILLING_GRACE_DAYS)
        invoice, was_created = Invoice.objects.get_or_create(
            client=client,
            period_month=today.month,
            period_year=today.year,
            defaults={'amount': client.plan.price, 'due_date': due_date, 'status': 'pending'},
        )
        if was_created:
            created_count += 1

    return f"{created_count} boletas generadas para el {today}"


@shared_task
def suspend_overdue_clients():
    today = timezone.now().date()
    overdue = Invoice.objects.filter(status='pending', due_date__lt=today)

    for invoice in overdue:
        invoice.status = 'overdue'
        invoice.save()

        client = invoice.client
        if client.status == 'active':
            client.status = 'suspended'
            client.save()

@shared_task
def send_invoice_reminders():
    """
    Tarea para notificar boletas próximas a vencer o ya vencidas.
    Normalmente, se ejecutan a través de celery-beat diariamente.
    """
    from django.core.mail import send_mail
    
    today = timezone.now().date()
    # 1. Boletas vencidas no pagadas y no anuladas
    overdue = Invoice.objects.filter(status='overdue').select_related('client')
    for inv in overdue:
        if inv.client.email:
            send_mail(
                subject=f"Recordatorio: Su boleta #{inv.id} está vencida",
                message=f"Hola {inv.client.first_name},\n\nLe recordamos que la boleta del mes {inv.period_month}/{inv.period_year} se encuentra vencida.\nTotal: ${inv.amount}\n\nPor favor regularice su pago a la brevedad para evitar cortes de internet.\n\nAtte,\nFibraPuconCore",
                from_email='billing@fibrapuconcore.cl',
                recipient_list=[inv.client.email],
                fail_silently=True,
            )

    # 2. Boletas por vencer en 3 días (Recordatorio preventivo)
    upcoming = Invoice.objects.filter(
        status='pending',
        due_date=today + timezone.timedelta(days=3)
    ).select_related('client')
    for inv in upcoming:
        if inv.client.email:
            send_mail(
                subject=f"Aviso de Cobro: Boleta #{inv.id} próxima a vencer",
                message=f"Hola {inv.client.first_name},\n\nLe avisamos que su boleta del mes {inv.period_month}/{inv.period_year} vence el {inv.due_date.strftime('%d/%m/%Y')}.\nTotal a pagar: ${inv.amount}\n\nAtte,\nFibraPuconCore",
                from_email='billing@fibrapuconcore.cl',
                recipient_list=[inv.client.email],
                fail_silently=True,
            )
