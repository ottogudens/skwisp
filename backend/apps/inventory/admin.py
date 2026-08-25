from django.contrib import admin
from .models import Equipment


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['equipment_type', 'brand', 'model', 'serial_number', 'status', 'assigned_client']
    list_filter = ['equipment_type', 'status']
    search_fields = ['serial_number', 'mac_address']
