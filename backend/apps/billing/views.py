from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Invoice
from .serializers import InvoiceSerializer
from apps.payments.services import create_payment_preference


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('client').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'])
    def create_payment(self, request, pk=None):
        invoice = self.get_object()
        init_point = create_payment_preference(invoice)
        return Response({'init_point': init_point})
