from django.db import models
from apps.clients.models import Client


class Invoice(models.Model):
    STATUS = [
        ('pending', 'Pendiente'),
        ('paid', 'Pagada'),
        ('overdue', 'Vencida'),
        ('cancelled', 'Anulada'),
    ]

    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='invoices')
    period_month = models.PositiveSmallIntegerField()
    period_year = models.PositiveSmallIntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('client', 'period_month', 'period_year')
        ordering = ['-period_year', '-period_month']

    def __str__(self):
        return f"Boleta {self.client} {self.period_month}/{self.period_year}"
