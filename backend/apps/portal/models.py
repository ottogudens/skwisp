import secrets
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

from apps.clients.models import Client


def generate_portal_token():
    return secrets.token_urlsafe(48)


class ClientUserManager(BaseUserManager):
    """Manager para ClientUser — crea usuarios del portal con RUT como identificador."""

    def create_user(self, rut, email, password=None, client=None):
        if not rut:
            raise ValueError('El RUT es obligatorio')
        email = self.normalize_email(email)
        user = self.model(rut=rut, email=email, client=client)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, rut, email, password=None):
        raise NotImplementedError('ClientUser no admite superusuarios')


class ClientUser(AbstractBaseUser):
    """
    Usuario del portal self-service. Uno por cliente del ISP.
    El login se realiza con RUT (formato: 12345678-9) + contraseña.
    La contraseña inicial la genera el operador al crear el acceso al portal.
    """

    client = models.OneToOneField(
        Client,
        on_delete=models.CASCADE,
        related_name='portal_user',
        verbose_name='Cliente asociado',
    )
    rut = models.CharField(
        max_length=12,
        unique=True,
        verbose_name='RUT',
        help_text='Formato: 12345678-9 (sin puntos)',
    )
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)  # requerido por AbstractBaseUser

    objects = ClientUserManager()

    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name = 'Usuario del portal'
        verbose_name_plural = 'Usuarios del portal'

    def __str__(self):
        return f'{self.rut} — {self.client}'

    def has_perm(self, perm, obj=None):
        return False

    def has_module_perms(self, app_label):
        return False


class PortalToken(models.Model):
    """Token de autenticación para usuarios del portal de clientes."""

    key = models.CharField(max_length=64, unique=True, default=generate_portal_token)
    user = models.OneToOneField(ClientUser, on_delete=models.CASCADE, related_name='auth_token')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'portal'

    def __str__(self):
        return f'Token portal: {self.user.rut}'
