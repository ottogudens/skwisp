# skwisp

Sistema de gestión y facturación para ISP (fibra óptica + MikroTik), desarrollado para **FibraPuconCore**. Alternativa propia a plataformas tipo MikroWisp, con control total sobre el stack.

## Arquitectura

```
Backend:  Django REST Framework + PostgreSQL
Frontend: React + Vite
Auth API: Token Authentication
RADIUS:   FreeRADIUS (PostgreSQL backend)
Pagos:    Mercado Pago (Checkout Pro + Webhooks)
Deploy:   Railway
```

## Módulos

- **clients** — gestión de clientes, planes, credenciales PPPoE
- **radius_sync** — sincronización Django → FreeRADIUS (radcheck/radreply/radusergroup)
- **billing** — ciclos de facturación, generación automática de boletas (Celery beat)
- **payments** — integración Mercado Pago (preferencias de pago, webhooks)
- **tickets** — soporte técnico
- **inventory** — equipos (ONUs, routers CPE) y asignación a clientes

## Estructura del repositorio

```
skwisp/
├── backend/           # Django REST Framework
│   └── apps/
│       ├── clients/
│       ├── radius_sync/
│       ├── billing/
│       ├── payments/
│       ├── tickets/
│       └── inventory/
├── frontend/          # React + Vite
│   └── src/
│       ├── api/
│       ├── pages/
│       ├── layouts/
│       └── context/
├── freeradius/         # Config de FreeRADIUS (clients.conf.example, schema)
└── docker-compose.yml  # Entorno de laboratorio FreeRADIUS + PostgreSQL
```

## Entorno de pruebas (laboratorio)

Antes de migrar producción (CCR1016), el sistema se prueba en un **RB4011** de laboratorio:

1. Copiar `freeradius/clients.conf.example` → `freeradius/clients.conf` y completar el secret (`openssl rand -hex 32`)
2. Copiar `backend/.env.example` → `backend/.env` y completar credenciales
3. Levantar FreeRADIUS + PostgreSQL:
   ```bash
   docker compose up -d radius-db
   docker compose run --rm freeradius cat /etc/raddb/mods-config/sql/main/postgresql/schema.sql > freeradius/schema.sql
   docker compose up -d
   ```
4. En el RB4011 (RouterOS):
   ```
   /radius add service=ppp address=<IP_FREERADIUS> secret=<shared_secret> timeout=3s
   /radius incoming set accept=yes port=3799
   /ppp aaa set use-radius=yes accounting=yes interim-update=5m
   /interface pppoe-server server add interface=<vlan_lab> service-name=fibrapuconcore-lab authentication=pap,chap
   ```
5. Validar:
   ```bash
   docker exec -it freeradius radtest <pppoe_username> <password> localhost 0 <shared_secret>
   ```

## Backend — setup local

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

## Frontend — setup local

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Estado del proyecto

- [x] Modelo de datos definido (clients, radius_sync, billing, payments, tickets, inventory)
- [x] Servicio de sincronización Django → FreeRADIUS
- [x] Webhook de Mercado Pago + suspensión automática por mora
- [x] Frontend base (dashboard, clientes, facturación, tickets, inventario, logs RADIUS)
- [x] docker-compose de laboratorio (FreeRADIUS + PostgreSQL)
- [ ] Pruebas en RB4011 (laboratorio) — en curso
- [ ] Serializers y ViewSets DRF completos
- [ ] Migración a producción (CCR1016)
