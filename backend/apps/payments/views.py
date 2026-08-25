from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from apps.billing.models import Invoice
from .models import Payment
from .services import get_sdk
from .webhook_security import validate_mp_signature


@csrf_exempt
def mercadopago_webhook(request):
    if not validate_mp_signature(request, getattr(settings, 'MP_WEBHOOK_SECRET', '')):
        return JsonResponse({'error': 'invalid signature'}, status=401)

    payment_id = request.GET.get('data.id') or request.POST.get('data', {}).get('id')
    if not payment_id:
        return JsonResponse({'error': 'no payment id'}, status=400)

    sdk = get_sdk()
    mp_response = sdk.payment().get(payment_id)
    mp_data = mp_response['response']

    external_reference = mp_data.get('external_reference')
    status = mp_data.get('status')

    try:
        invoice = Invoice.objects.get(id=external_reference)
    except Invoice.DoesNotExist:
        return JsonResponse({'error': 'invoice not found'}, status=404)

    Payment.objects.update_or_create(
        mp_payment_id=payment_id,
        defaults={
            'invoice': invoice,
            'amount': mp_data.get('transaction_amount'),
            'method': 'mercadopago',
            'mp_status': status,
            'raw_webhook_payload': mp_data,
        },
    )

    if status == 'approved' and invoice.status != 'paid':
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save()

        client = invoice.client
        if client.status == 'suspended':
            client.status = 'active'
            client.save()

    return JsonResponse({'status': 'ok'})


from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related('invoice').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
