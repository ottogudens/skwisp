from django.db.models import Q
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Client, Plan
from .serializers import (
    ClientListSerializer, ClientDetailSerializer, ClientCreateSerializer, PlanSerializer,
)
from apps.radius_sync.services import sync_client_to_radius


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(active=True)
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticated]


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('plan').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'rut', 'address']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        if self.action == 'create':
            return ClientCreateSerializer
        return ClientDetailSerializer

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        client = self.get_object()
        client.status = 'suspended'
        client.save()  # dispara signal -> sync_client_to_radius
        return Response({'status': 'suspended'})

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        client = self.get_object()
        client.status = 'active'
        client.save()
        return Response({'status': 'active'})

    @action(detail=True, methods=['post'])
    def force_sync(self, request, pk=None):
        client = self.get_object()
        try:
            sync_client_to_radius(client)
        except Exception as exc:  # noqa: BLE001
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'status': 'synced'})
