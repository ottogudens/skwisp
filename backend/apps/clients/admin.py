from django.contrib import admin
from .models import Plan, Client, ClientCredential


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'download_speed', 'upload_speed', 'price', 'active']
    list_filter = ['active']


class ClientCredentialInline(admin.StackedInline):
    model = ClientCredential
    extra = 0


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'rut', 'plan', 'status', 'billing_day']
    list_filter = ['status', 'plan']
    search_fields = ['first_name', 'last_name', 'rut', 'address']
    inlines = [ClientCredentialInline]
