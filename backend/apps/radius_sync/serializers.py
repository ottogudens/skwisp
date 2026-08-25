from rest_framework import serializers
from .models import RadiusSyncLog


class RadiusSyncLogSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = RadiusSyncLog
        fields = ['id', 'client', 'client_name', 'action', 'synced_at', 'success', 'error_message']

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"
