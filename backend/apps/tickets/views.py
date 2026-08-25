from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Ticket
from .serializers import TicketSerializer, TicketCommentSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.select_related('client', 'assigned_to').prefetch_related('comments').all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketCommentSerializer(
            data={**request.data, 'ticket': ticket.id}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user)
        return Response(serializer.data, status=201)
