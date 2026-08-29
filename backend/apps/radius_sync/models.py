from django.db import models
from apps.clients.models import Client


class NasDevice(models.Model):
    """
    Registro informativo de los routers MikroTik (NAS) declarados en freeradius/clients.conf.
    Este modelo NO controla el acceso real — solo documenta en el panel qué NAS existen,
    para que el shortname/ip coincida con lo configurado a mano en clients.conf. La fuente
    de verdad de la autenticación sigue siendo el archivo de FreeRADIUS.
    """
    ENVIRONMENT_CHOICES = [
        ('lab', 'Laboratorio'),
        ('production', 'Producción'),
    ]
    CONNECTION_CHOICES = [
        ('direct', 'IP pública directa'),
        ('wireguard', 'Túnel WireGuard'),
    ]

    name = models.CharField(max_length=100, help_text="Debe coincidir con el shortname en clients.conf")
    ip_address = models.GenericIPAddressField(
        help_text="IP que FreeRADIUS realmente ve en clients.conf: la del túnel WireGuard "
                   "si connection_type=wireguard, o la pública si es conexión directa."
    )
    connection_type = models.CharField(max_length=20, choices=CONNECTION_CHOICES, default='wireguard')
    wireguard_public_key = models.CharField(
        max_length=64, blank=True,
        help_text="Public key del peer en wg-easy — solo informativo, la config real vive en el hub WireGuard."
    )
    model = models.CharField(max_length=100, blank=True)  # ej. "RB4011iGS+", "CCR1016-12G"
    environment = models.CharField(max_length=20, choices=ENVIRONMENT_CHOICES, default='lab')
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['environment', 'name']

    def __str__(self):
        return f"{self.name} ({self.ip_address})"


class RadiusSyncLog(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='radius_logs')
    action = models.CharField(max_length=20)
    synced_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    attempt = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ['-synced_at']

    def __str__(self):
        return f"{self.client} - {self.action} ({'OK' if self.success else 'ERROR'})"
