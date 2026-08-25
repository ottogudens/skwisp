from django.db import models


class Plan(models.Model):
    name = models.CharField(max_length=100)
    download_speed = models.PositiveIntegerField(help_text="Mbps")
    upload_speed = models.PositiveIntegerField(help_text="Mbps")
    price = models.DecimalField(max_digits=10, decimal_places=0)
    burst_limit = models.CharField(max_length=100, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Client(models.Model):
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('suspended', 'Suspendido por mora'),
        ('cancelled', 'Dado de baja'),
        ('pending', 'Pendiente instalación'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    rut = models.CharField(max_length=12, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    installation_date = models.DateField(null=True, blank=True)
    billing_day = models.PositiveSmallIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.rut})"


class ClientCredential(models.Model):
    client = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='credential')
    pppoe_username = models.CharField(max_length=100, unique=True)
    pppoe_password = models.CharField(max_length=100)
    nas_ip = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return self.pppoe_username
