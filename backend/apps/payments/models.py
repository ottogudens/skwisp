from django.conf import settings
from django.db import models
from apps.billing.models import Invoice


class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    method = models.CharField(max_length=20)  # mercadopago, manual_cash, manual_transfer
    mp_payment_id = models.CharField(max_length=100, blank=True, null=True)
    mp_status = models.CharField(max_length=30, blank=True)
    # payment_type_id que reporta Mercado Pago: 'credit_card', 'debit_card',
    # 'bank_transfer', 'account_money', etc. Determina si el pago queda cubierto por
    # el mecanismo de "voucher válido como boleta" (solo tarjeta) o si requiere
    # boleta manual (transferencia) mientras no exista integración directa con el SII.
    mp_payment_type = models.CharField(max_length=30, blank=True)
    raw_webhook_payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # --- Boleta manual (pagos por transferencia, hasta que exista integración SII) ---
    requires_manual_boleta = models.BooleanField(
        default=False,
        help_text="True si el pago fue por transferencia y no está cubierto por el "
                   "voucher-válido-como-boleta de Mercado Pago (solo aplica a tarjeta).",
    )
    manual_boleta_issued = models.BooleanField(default=False)
    manual_boleta_number = models.CharField(max_length=50, blank=True, help_text="Folio SII")
    manual_boleta_issued_at = models.DateTimeField(null=True, blank=True)
    manual_boleta_issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='boletas_emitidas',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Pago {self.invoice} - {self.mp_status}"
