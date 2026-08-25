from celery import shared_task
from dateutil.relativedelta import relativedelta
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
        due_date = today + relativedelta(days=10)
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
