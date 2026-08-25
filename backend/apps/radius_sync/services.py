from django.db import connections
from .models import RadiusSyncLog


def sync_client_to_radius(client):
    """Idempotente: borra y reinserta el estado del cliente en las tablas de FreeRADIUS."""
    if not hasattr(client, 'credential'):
        return

    username = client.credential.pppoe_username
    password = client.credential.pppoe_password

    try:
        with connections['radius'].cursor() as cur:
            cur.execute("DELETE FROM radcheck WHERE username = %s", [username])
            cur.execute("DELETE FROM radreply WHERE username = %s", [username])
            cur.execute("DELETE FROM radusergroup WHERE username = %s", [username])

            if client.status == 'active':
                cur.execute(
                    "INSERT INTO radcheck (username, attribute, op, value) "
                    "VALUES (%s, 'Cleartext-Password', ':=', %s)",
                    [username, password],
                )
                rate = f"{client.plan.upload_speed}M/{client.plan.download_speed}M"
                cur.execute(
                    "INSERT INTO radreply (username, attribute, op, value) "
                    "VALUES (%s, 'Mikrotik-Rate-Limit', ':=', %s)",
                    [username, rate],
                )
            elif client.status == 'suspended':
                cur.execute(
                    "INSERT INTO radcheck (username, attribute, op, value) "
                    "VALUES (%s, 'Cleartext-Password', ':=', %s)",
                    [username, password],
                )
                cur.execute(
                    "INSERT INTO radcheck (username, attribute, op, value) "
                    "VALUES (%s, 'Auth-Type', ':=', 'Reject')",
                    [username],
                )
            # cancelled/pending: no se inserta nada -> rechazo automático

        RadiusSyncLog.objects.create(client=client, action=f'sync_{client.status}', success=True)
    except Exception as exc:  # noqa: BLE001
        RadiusSyncLog.objects.create(
            client=client, action=f'sync_{client.status}', success=False, error_message=str(exc)
        )
        raise
