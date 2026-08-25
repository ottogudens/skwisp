from django.apps import AppConfig


class ClientsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.clients'

    def ready(self):
        # Registrar las señales que sincronizan el estado del cliente con FreeRADIUS.
        # IMPORTANTE: importar aquí dentro de ready() para evitar importaciones circulares.
        import apps.clients.signals  # noqa: F401
