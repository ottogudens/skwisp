from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'client', 'client_name', 'period_month', 'period_year',
            'amount', 'issue_date', 'due_date', 'status', 'paid_at',
        ]

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"
