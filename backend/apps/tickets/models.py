from django.conf import settings
from django.db import models
from apps.clients.models import Client


class Ticket(models.Model):
    PRIORITY = [('low', 'Baja'), ('medium', 'Media'), ('high', 'Alta'), ('critical', 'Crítica')]
    STATUS = [
        ('open', 'Abierto'),
        ('in_progress', 'En proceso'),
        ('resolved', 'Resuelto'),
        ('closed', 'Cerrado'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='tickets')
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY, default='medium')
    status = models.CharField(max_length=15, choices=STATUS, default='open')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class TicketComment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
