from rest_framework import serializers
from .models import Client, ClientCredential, Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'name', 'download_speed', 'upload_speed', 'price', 'burst_limit', 'active']


class ClientCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientCredential
        fields = ['pppoe_username', 'pppoe_password', 'nas_ip']
        extra_kwargs = {'pppoe_password': {'write_only': True}}


class ClientListSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'rut', 'phone', 'address',
            'plan', 'plan_name', 'status', 'billing_day',
        ]


class ClientDetailSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    credential = ClientCredentialSerializer(read_only=True)
    recent_invoices = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'rut', 'email', 'phone', 'address',
            'latitude', 'longitude', 'plan', 'plan_name', 'status',
            'installation_date', 'billing_day', 'created_at',
            'credential', 'recent_invoices',
        ]

    def get_recent_invoices(self, obj):
        from apps.billing.serializers import InvoiceSerializer
        return InvoiceSerializer(obj.invoices.all()[:6], many=True).data


class ClientCreateSerializer(serializers.ModelSerializer):
    pppoe_username = serializers.CharField(write_only=True)
    pppoe_password = serializers.CharField(write_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'rut', 'email', 'phone', 'address',
            'latitude', 'longitude', 'plan', 'status', 'installation_date',
            'billing_day', 'pppoe_username', 'pppoe_password',
        ]

    def create(self, validated_data):
        username = validated_data.pop('pppoe_username')
        password = validated_data.pop('pppoe_password')
        validated_data.setdefault('status', 'pending')
        client = Client.objects.create(**validated_data)
        ClientCredential.objects.create(
            client=client, pppoe_username=username, pppoe_password=password
        )
        return client
