from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Client


@receiver(post_save, sender=Client)
def sync_on_status_change(sender, instance, **kwargs):
    """
    Encola la sincronización a FreeRADIUS de forma asíncrona (Celery), con reintentos
    automáticos ante fallos transitorios. No se llama sync_client_to_radius() aquí
    directamente para no bloquear el request HTTP ni perder el cambio si RADIUS
    está momentáneamente inalcanzable.
    """
    if hasattr(instance, 'credential'):
        from apps.radius_sync.tasks import sync_client_to_radius_task
        sync_client_to_radius_task.delay(instance.id)
