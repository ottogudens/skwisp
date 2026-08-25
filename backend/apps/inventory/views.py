from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Equipment
from .serializers import EquipmentSerializer


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.select_related('assigned_client').all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        equipment = self.get_object()
        equipment.assigned_client_id = request.data.get('client')
        equipment.status = 'installed'
        equipment.assigned_date = timezone.now().date()
        equipment.save()
        return Response(EquipmentSerializer(equipment).data)
