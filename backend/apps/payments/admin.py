from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'invoice', 'amount', 'method', 'mp_payment_type', 'mp_status',
        'requires_manual_boleta', 'manual_boleta_issued', 'created_at',
    ]
    list_filter = ['method', 'mp_status', 'requires_manual_boleta', 'manual_boleta_issued']
    readonly_fields = ['raw_webhook_payload']
