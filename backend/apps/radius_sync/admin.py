from django.contrib import admin
from .models import RadiusSyncLog


@admin.register(RadiusSyncLog)
class RadiusSyncLogAdmin(admin.ModelAdmin):
    list_display = ['client', 'action', 'success', 'synced_at']
    list_filter = ['success', 'action']
    readonly_fields = ['client', 'action', 'synced_at', 'success', 'error_message']

    def has_add_permission(self, request):
        return False
