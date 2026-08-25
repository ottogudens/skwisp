from rest_framework import serializers

from apps.billing.models import Invoice
from apps.billing.serializers import InvoiceSerializer
from apps.clients.serializers import ClientDetailSerializer
from apps.tickets.models import Ticket, TicketComment
from .models import ClientUser


class PortalMeSerializer(serializers.ModelSerializer):
    """Datos del cliente autenticado visibles en el portal."""

    client = ClientDetailSerializer(read_only=True)

    class Meta:
        model = ClientUser
        fields = ['rut', 'email', 'client']


class PortalInvoiceSerializer(serializers.ModelSerializer):
    """Facturas del cliente vistas desde el portal — sin datos de otros clientes."""

    payment_url = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'period_month', 'period_year', 'amount',
            'issue_date', 'due_date', 'status', 'paid_at', 'payment_url',
        ]

    def get_payment_url(self, obj):
        request = self.context.get('request')
        if request and obj.status in ('pending', 'overdue'):
            return request.build_absolute_uri(f'/api/portal/invoices/{obj.id}/pay/')
        return None


class PortalTicketCreateSerializer(serializers.ModelSerializer):
    """Serializer para que el cliente cree un ticket desde el portal."""

    CATEGORY_CHOICES = [
        ('no_connection', 'Sin conexión / sin señal'),
        ('slow_speed', 'Velocidad lenta'),
        ('plan_change', 'Cambio de plan'),
        ('data_change', 'Cambio de datos personales'),
        ('other', 'Otro'),
    ]
    category = serializers.ChoiceField(choices=CATEGORY_CHOICES, write_only=True, required=False)

    class Meta:
        model = Ticket
        fields = ['title', 'description', 'priority', 'category']
        extra_kwargs = {
            'priority': {'default': 'medium'},
        }


class PortalTicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = ['id', 'author_name', 'body', 'created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username


class PortalTicketSerializer(serializers.ModelSerializer):
    comments = PortalTicketCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'priority', 'status', 'created_at', 'resolved_at', 'comments']
        read_only_fields = ['status', 'created_at', 'resolved_at']
