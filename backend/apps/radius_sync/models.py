from django.db import models
from apps.clients.models import Client


class RadiusSyncLog(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='radius_logs')
    action = models.CharField(max_length=20)
    synced_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-synced_at']

    def __str__(self):
        return f"{self.client} - {self.action} ({'OK' if self.success else 'ERROR'})"
