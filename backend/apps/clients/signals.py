from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Client
from apps.radius_sync.services import sync_client_to_radius


@receiver(post_save, sender=Client)
def sync_on_status_change(sender, instance, **kwargs):
    if hasattr(instance, 'credential'):
        sync_client_to_radius(instance)
