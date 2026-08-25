from rest_framework import serializers
from .models import Ticket, TicketComment


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = TicketComment
        fields = ['id', 'ticket', 'author', 'author_name', 'body', 'created_at']
        read_only_fields = ['author']


class TicketSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    comments = TicketCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'client', 'client_name', 'title', 'description', 'priority',
            'status', 'assigned_to', 'assigned_to_name', 'created_at',
            'resolved_at', 'comments',
        ]

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"
