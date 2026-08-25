from django.db import models
from apps.clients.models import Client


class Equipment(models.Model):
    TYPE = [('onu', 'ONU'), ('router', 'Router CPE'), ('antenna', 'Antena')]

    equipment_type = models.CharField(max_length=20, choices=TYPE)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True)
    mac_address = models.CharField(max_length=17, blank=True)
    status = models.CharField(max_length=20, default='in_stock')
    assigned_client = models.ForeignKey(
        Client, null=True, blank=True, on_delete=models.SET_NULL, related_name='equipment'
    )
    assigned_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.brand} {self.model} ({self.serial_number})"
