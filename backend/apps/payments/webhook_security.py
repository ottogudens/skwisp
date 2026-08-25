"""
Validación de firma de webhooks de Mercado Pago.
Referencia: https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/notifications/webhooks

MP firma cada notificación con un header x-signature. Validar esto evita que
alguien externo llame al endpoint y procese notificaciones falsas.
"""
import hashlib
import hmac
import os


def validate_mp_signature(request, secret):
    """
    Devuelve True si la firma del webhook es válida.

    Si MP_WEBHOOK_SECRET no está configurado:
      - DJANGO_ENV=production → retorna False (falla segura, nunca permite sin secret).
      - Cualquier otro entorno  → retorna True (facilita pruebas locales/lab).
    """
    if not secret:
        if os.getenv('DJANGO_ENV', 'development') == 'production':
            return False
        return True

    x_signature = request.headers.get('x-signature', '')
    x_request_id = request.headers.get('x-request-id', '')

    if not x_signature:
        return False

    parts = dict(p.split('=', 1) for p in x_signature.split(',') if '=' in p)
    ts = parts.get('ts', '')
    received_hash = parts.get('v1', '')

    data_id = request.GET.get('data.id', '')

    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    # FIX: hmac.new() con keyword args explícitos (evita confusión con hmac.HMAC)
    computed_hash = hmac.new(
        key=secret.encode(),
        msg=manifest.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed_hash, received_hash)
