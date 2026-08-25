from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import RadiusSyncLog
from .serializers import RadiusSyncLogSerializer


class RadiusSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RadiusSyncLog.objects.select_related('client').all()
    serializer_class = RadiusSyncLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        success_param = self.request.query_params.get('success')
        if success_param is not None:
            qs = qs.filter(success=success_param.lower() == 'true')
        return qs
