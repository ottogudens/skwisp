from django.urls import path
from . import views

app_name = 'portal'

urlpatterns = [
    # Autenticación
    path('auth/login/', views.portal_login, name='login'),

    # Datos del cliente autenticado
    path('me/', views.PortalMeView.as_view(), name='me'),

    # Facturación
    path('invoices/', views.PortalInvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/pay/', views.portal_create_payment, name='invoice-pay'),
    path('invoices/<int:pk>/pdf/', views.portal_download_pdf, name='invoice-pdf'),

    # Soporte
    path('tickets/', views.PortalTicketListView.as_view(), name='ticket-list'),
    path('tickets/<int:pk>/', views.PortalTicketDetailView.as_view(), name='ticket-detail'),
]
