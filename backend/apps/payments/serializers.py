from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'client_name', 'amount', 'method', 'mp_payment_id',
            'mp_status', 'mp_payment_type', 'created_at',
            'requires_manual_boleta', 'manual_boleta_issued', 'manual_boleta_number',
            'manual_boleta_issued_at',
        ]

    def get_client_name(self, obj):
        client = obj.invoice.client
        return f"{client.first_name} {client.last_name}"
