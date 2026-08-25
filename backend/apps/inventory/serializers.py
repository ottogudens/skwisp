from rest_framework import serializers
from .models import Equipment


class EquipmentSerializer(serializers.ModelSerializer):
    assigned_client_name = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            'id', 'equipment_type', 'brand', 'model', 'serial_number',
            'mac_address', 'status', 'assigned_client', 'assigned_client_name',
            'assigned_date',
        ]

    def get_assigned_client_name(self, obj):
        if obj.assigned_client:
            return f"{obj.assigned_client.first_name} {obj.assigned_client.last_name}"
        return None
