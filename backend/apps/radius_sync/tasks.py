from celery import shared_task
from celery.utils.log import get_task_logger

from .services import sync_client_to_radius
from .models import RadiusSyncLog

logger = get_task_logger(__name__)


@shared_task(bind=True, max_retries=5, default_retry_delay=30)
def sync_client_to_radius_task(self, client_id):
    """
    Versión asíncrona y con reintentos de sync_client_to_radius().
    Se encola desde el signal post_save de Client — así un problema transitorio
    (ej. Postgres de radius momentáneamente inalcanzable) no deja al cliente
    en un estado inconsistente (pagó pero sigue cortado, o viceversa).

    Reintenta hasta 5 veces con backoff (30s, 60s, 120s...).
    """
    from apps.clients.models import Client

    try:
        client = Client.objects.select_related('plan', 'credential').get(pk=client_id)
    except Client.DoesNotExist:
        logger.warning("sync_client_to_radius_task: cliente %s ya no existe, se omite", client_id)
        return

    try:
        sync_client_to_radius(client, attempt=self.request.retries + 1)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Fallo al sincronizar cliente %s con RADIUS (intento %s/%s): %s",
            client_id, self.request.retries + 1, self.max_retries, exc,
        )
        raise self.retry(exc=exc)


@shared_task
def retry_failed_radius_syncs():
    """
    Red de seguridad: corre periódicamente y reintenta clientes cuyo ÚLTIMO
    RadiusSyncLog haya sido un error. Cubre el caso donde la tarea con reintentos
    ya agotó sus intentos, o donde el sync nunca se disparó (ej. tras un deploy).
    """
    from apps.clients.models import Client

    # Últimos logs por cliente: si el más reciente fue un error, reintentamos.
    stale_client_ids = (
        RadiusSyncLog.objects.filter(success=False)
        .order_by('client_id', '-synced_at')
        .distinct('client_id')
        .values_list('client_id', flat=True)
    )

    retried = 0
    for client_id in stale_client_ids:
        latest_log = (
            RadiusSyncLog.objects.filter(client_id=client_id).order_by('-synced_at').first()
        )
        if latest_log and not latest_log.success:
            sync_client_to_radius_task.delay(client_id)
            retried += 1

    return f"{retried} clientes reencolados para reintento de sync RADIUS"
