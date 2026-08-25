from django.contrib import admin
from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['client', 'period_month', 'period_year', 'amount', 'status', 'due_date']
    list_filter = ['status', 'period_year', 'period_month']
    search_fields = ['client__first_name', 'client__last_name', 'client__rut']
