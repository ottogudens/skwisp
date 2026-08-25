from django.contrib import admin
from .models import ClientUser
from .views import PortalToken


@admin.register(ClientUser)
class ClientUserAdmin(admin.ModelAdmin):
    list_display = ['rut', 'client', 'email', 'is_active', 'created_at', 'last_login']
    list_filter = ['is_active']
    search_fields = ['rut', 'email', 'client__first_name', 'client__last_name']
    readonly_fields = ['created_at', 'last_login']
    actions = ['activate_users', 'deactivate_users', 'reset_token']

    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
    activate_users.short_description = 'Activar acceso al portal'

    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_users.short_description = 'Desactivar acceso al portal'

    def reset_token(self, request, queryset):
        for user in queryset:
            PortalToken.objects.filter(user=user).delete()
        self.message_user(request, f'Token(s) regenerado(s) para {queryset.count()} usuario(s).')
    reset_token.short_description = 'Regenerar token de acceso'
