from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.clients.views import ClientViewSet, PlanViewSet
from apps.billing.views import InvoiceViewSet
from apps.payments.views import PaymentViewSet, mercadopago_webhook
from apps.tickets.views import TicketViewSet
from apps.inventory.views import EquipmentViewSet
from apps.radius_sync.views import RadiusSyncLogViewSet

router = DefaultRouter()
router.register('clients', ClientViewSet, basename='client')
router.register('plans', PlanViewSet, basename='plan')
router.register('invoices', InvoiceViewSet, basename='invoice')
router.register('payments', PaymentViewSet, basename='payment')
router.register('tickets', TicketViewSet, basename='ticket')
router.register('equipment', EquipmentViewSet, basename='equipment')
router.register('radius-sync-logs', RadiusSyncLogViewSet, basename='radius-sync-log')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/payments/webhook/', mercadopago_webhook, name='mp-webhook'),
    path('api/portal/', include('apps.portal.urls', namespace='portal')),
]
