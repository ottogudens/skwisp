import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from apps.clients.models import Plan, Client
from apps.portal.models import ClientUser

# 1. Crear Admin
admin_email = "admin@skale.cl"
admin_pass = "Pa55#2026."
if not User.objects.filter(username=admin_email).exists():
    User.objects.create_superuser(
        username=admin_email,
        email=admin_email,
        password=admin_pass
    )
    print(f"✅ Admin creado ({admin_email})")
else:
    u = User.objects.get(username=admin_email)
    u.set_password(admin_pass)
    u.save()
    print(f"✅ Admin actualizado ({admin_email})")


# 2. Crear Cliente y Usuario del Portal
client_rut = "11111111-1"
client_email = "cliente@skale.cl"
client_pass = "cliente123."

plan, _ = Plan.objects.get_or_create(
    name="Plan Comercial Base",
    defaults={"download_speed": 100, "upload_speed": 50, "price": 19990}
)

client, _ = Client.objects.get_or_create(
    rut=client_rut,
    defaults={
        "first_name": "Usuario",
        "last_name": "Demo",
        "email": client_email,
        "phone": "+56900000000",
        "address": "Calle Falsa 123",
        "plan": plan
    }
)

if not ClientUser.objects.filter(rut=client_rut).exists():
    ClientUser.objects.create_user(
        rut=client_rut,
        email=client_email,
        password=client_pass,
        client=client
    )
    print(f"✅ Cliente del portal creado. (Login RUT: {client_rut} | Password: {client_pass})")
else:
    cuser = ClientUser.objects.get(rut=client_rut)
    cuser.set_password(client_pass)
    cuser.save()
    print(f"✅ Cliente del portal actualizado (Login RUT: {client_rut} | Password: {client_pass})")
