from django.contrib import admin
from .models import RadiusSyncLog, NasDevice


@admin.register(NasDevice)
class NasDeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'ip_address', 'connection_type', 'model', 'environment', 'active']
    list_filter = ['environment', 'active', 'connection_type']
    search_fields = ['name', 'ip_address', 'model']


@admin.register(RadiusSyncLog)
class RadiusSyncLogAdmin(admin.ModelAdmin):
    list_display = ['client', 'action', 'success', 'attempt', 'synced_at']
    list_filter = ['success', 'action']
    readonly_fields = ['client', 'action', 'synced_at', 'success', 'error_message', 'attempt']

    def has_add_permission(self, request):
        return False
