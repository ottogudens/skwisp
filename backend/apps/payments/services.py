import mercadopago
from django.conf import settings


def get_sdk():
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def create_payment_preference(invoice):
    sdk = get_sdk()
    preference_data = {
        "items": [{
            "title": f"Internet {invoice.client.plan.name} - {invoice.period_month}/{invoice.period_year}",
            "quantity": 1,
            "unit_price": float(invoice.amount),
        }],
        "external_reference": str(invoice.id),
        "notification_url": f"{settings.SITE_URL}/api/payments/webhook/",
        "back_urls": {
            "success": f"{settings.SITE_URL}/pago-exitoso",
            "failure": f"{settings.SITE_URL}/pago-fallido",
        },
        "auto_return": "approved",
    }
    result = sdk.preference().create(preference_data)
    return result["response"]["init_point"]
