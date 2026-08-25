from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'amount', 'method', 'mp_status', 'created_at']
    list_filter = ['method', 'mp_status']
    readonly_fields = ['raw_webhook_payload']
