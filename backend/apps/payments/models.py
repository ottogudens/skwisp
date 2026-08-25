from django.db import models
from apps.billing.models import Invoice


class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    method = models.CharField(max_length=20)  # mercadopago, manual_cash, manual_transfer
    mp_payment_id = models.CharField(max_length=100, blank=True, null=True)
    mp_status = models.CharField(max_length=30, blank=True)
    raw_webhook_payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago {self.invoice} - {self.mp_status}"
