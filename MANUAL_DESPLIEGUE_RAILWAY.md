# Manual de Despliegue en Railway - Skwisp

Este documento detalla el proceso paso a paso para desplegar todos los componentes de la aplicación **Skwisp** utilizando [Railway](https://railway.app/). 

La infraestructura necesaria incluye:
1. **Bases de Datos:** Principal (PostgreSQL) y FreeRADIUS (PostgreSQL)
2. **Caché/Broker:** Redis (para Celery)
3. **Backend:** Django (API Principal) y Celery Worker
4. **Laboratorio de Pruebas Radius:** FreeRADIUS Server
5. **Frontends:** Admin y Portal (Vite/React)

---

## 1. Bases de Datos & Redis

Crea primero los servicios de persistencia y caché dentro de tu proyecto en Railway.

### 1.1 Base de Datos Principal (PostgreSQL)
- **Método:** Botón `New` > `Database` > `Add PostgreSQL`
- **Uso:** Almacena clientes, facturación, tickets e inventario de Django.
- **Variables Generadas:** Railway creará automáticamente variables como `DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER`, etc.

### 1.2 Base de Datos para FreeRADIUS
Puedes optar por desplegar una **segunda instancia** de PostgreSQL, o en su defecto, crear una base de datos adicional dentro de la instancia que ya creaste. 
- Recomendación: Crear un **segundo PostgreSQL** (Botón `New` > `Database` > `Add PostgreSQL`).
- Renombra el servicio principal a `db-skwisp` y este a `db-radius`.

### 1.3 Caché - Redis
- **Método:** Botón `New` > `Database` > `Add Redis`
- **Uso:** Funciona como Broker para encolar tareas asíncronas con Celery.
- **Variables Generadas:** Railway creará `REDIS_URL`.

---

## 2. Backend (Django API)

- **Método:** Botón `New` > `GitHub Repo` > Otorga permisos y selecciona el repositorio de la aplicación.
- En la configuración del servicio (`Settings`), configura el **Root Directory** a `/backend`.
- Configuraciones de **Build**:
  - Railway debería detectar automáticamente que es Python por el `requirements.txt`.
  - Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- **Variables de Entorno (`Variables`):**

| Variable | Valor / Origen | Descripción |
|----------|----------------|-------------|
| `DEBUG` | `False` | Desactiva el modo depuración en producción. |
| `SECRET_KEY` | *(Generar un valor seguro)* | Llave secreta de Django. |
| `ALLOWED_HOSTS` | `*` o `midominio.up.railway.app` | Dominios permitidos. |
| `CORS_ALLOWED_ORIGINS` | `https://tu-frontend.up.railway.app` | URL de origen de react (frontend/portal). Puede ser separado por comas si hay varios. |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Referencia a tu base de datos principal. |
| `RADIUS_DATABASE_URL`| `${{Postgres-Radius.DATABASE_URL}}` | Referencia a la BD de FreeRADIUS. |
| `CELERY_BROKER_URL` | `${{Redis.REDIS_URL}}` | URL del servicio Redis. |
| `SITE_URL` | `https://tu-dominio-backend.up.railway.app` | URL pública del backend. |
| `MP_ACCESS_TOKEN` | *(Tu Access Token)* | Credencial Mercado Pago. |
| `MP_WEBHOOK_SECRET` | *(Tu Webhook Secret)* | Credencial Mercado Pago. |
| `PORT` | `8000` | Puerto en el que Gunicorn escuchará las peticiones. |

- *Nota:* Asegúrate de correr las migraciones en producción. Puedes agregar un **Custom Build Command** o conectarte temporalmente para ejecutar `python manage.py migrate`.

---

## 3. Worker de Celery

Railway requiere crear un servicio por cada proceso distinto.
- **Método:** Duplicate tu servicio Backend. O bien, crea un `New` > `GitHub Repo` > Selecciona el clon, Root directory en `/backend`.
- **Start Command:** `celery -A config worker -l info`
- **Variables de Entorno:**
  Copia **TODAS** las variables de entorno del Backend Principal en este servicio.
  *(Importante que `CELERY_BROKER_URL` y variables de entorno apunten a los mismos servicios).*
- No es necesario exponer un dominio para este servicio.

---

## 4. Frontend - Admin Principal

- **Método:** Botón `New` > `GitHub Repo` > Selecciona el repositorio.
- **Root Directory:** `/frontend`
- **Build / Start settings:**
  - Railway usará **Nodejs Vite Builder** o Nixpacks.
  - Asegúrate de que el **Build Command** es `npm install && npm run build` (usualmente automático).
- **Variables de Entorno:**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| ` ` | `https://tu-dominio-backend.up.railway.app` | Debes apuntarlo al dominio que Railway generó para tu Backend Django (incluir `/api` si corresponde, ver `vite.config.js`). |

> **IMPORTANTE:** Cuando Railway haga build del frontend, estampará estáticamente el valor de `VITE_API_URL`. Debes desplegar o asignar dominio al Backend primero.

---

## 5. Frontend - Portal de Clientes

- **Método:** Botón `New` > `GitHub Repo` > Selecciona el repositorio.
- **Root Directory:** `/frontend/portal`
- **Build / Start settings:** Misma configuración que el Admin.
- **Variables de Entorno:** Configura `VITE_API_URL` apuntando a tu backend.

---

## 6. Servidor FreeRADIUS

Desplegar FreeRADIUS en Railway requiere una aproximación especial, ya que Railway no soporta el montaje en caliente de directorios locales (como se hace en `docker-compose.yml` a través de `volumes`), y además FreeRADIUS utiliza tráfico **UDP** (puertos 1812 para autenticación y 1813 para accounting).

Sigue estos pasos para desplegarlo correctamente:

### 6.1. Crear un Dockerfile
Para inyectar los archivos `clients.conf` y `mods-enabled/sql` de forma nativa a Railway, debes "empaquetar" la imagen. Crea un archivo llamado `Dockerfile` dentro del directorio `freeradius/` en tu repositorio, con el siguiente contenido:

```dockerfile
# freeradius/Dockerfile
FROM freeradius/freeradius-server:3.2.5

# Copiar configuraciones locales al contenedor
COPY clients.conf /etc/raddb/clients.conf
COPY mods-enabled/sql /etc/raddb/mods-enabled/sql

# Exponer puertos estándar UDP
EXPOSE 1812/udp 1813/udp
```

Al incluir este archivo y subirlo a tu repositorio, Railway sabrá cómo procesar tu contenedor Radius usando la configuración modificada.

### 6.2. Creación del Servicio en Railway
- **Método:** Botón `New` > `GitHub Repo` > Selecciona el repositorio de tu proyecto.
- **Root Directory:** En los *Settings* del servicio, cambia el Root Directory a `/freeradius`.
- Railway detectará inmediatamente el `Dockerfile` y comenzará a compilar la imagen personalizada de Radius.

### 6.3. Variables de Entorno (Conexión a BD)
Para que FreeRADIUS hable con tu base de datos de Railway, agrega estas variables en la pestaña `Variables` del servicio FreeRADIUS:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `POSTGRESQL_SERVER` | `${{Postgres-Radius.RAILWAY_PRIVATE_DOMAIN}}` | Dominio interno (Privado) de tu BD Radius en Railway. |
| `POSTGRESQL_LOGIN` | `postgres` (o tu usuario) | Usuario generado para Postgres. |
| `POSTGRESQL_PASSWORD` | `${{Postgres-Radius.POSTGRES_PASSWORD}}` | Contraseña generada por Railway Postgres. |
| `POSTGRESQL_DATABASE` | `railway` (o tu db name) | Nombre de la base de datos a utilizar. |
| `RADIUS_CLIENT_SECRET` | *(Generar un valor seguro)* | Secreto para conectar los Mikrotik. Leído desde `clients.conf`. |

### 6.4. Exposición de Puertos UDP (Conexión con Mikrotik)
Por defecto, Railway solo enruta tráfico HTTP/HTTPS. Para que tus routers Mikrotik alcancen a este Radius, debes habilitar el proxy UDP:
1. Ve a la pestaña **Settings** del servicio FreeRADIUS.
2. Desplázate hacia abajo hasta la sección **Public Networking**.
3. Selecciona **TCP Proxy** y cámbialo a **TCP/UDP Proxy** o genera un subdominio de Proxy público (las opciones varían ligeramente con actualizaciones de Railway).
4. Configura el ruteo de red apuntando al servicio en los puertos **1812 (UDP)** y **1813 (UDP)**.
5. Railway te asignará un dominio especial y unos puertos externos asignados aleatoriamente (ej: `mi-proxy.up.railway.app:13725`). 
6. **Configuración Final:** En tu router **Mikrotik** usarás ese puerto público en vez del típico 1812/1813.

---

## 7. Pasos Post-Despliegue (Verificaciones)

1. **Migraciones:** Ejecuta `python manage.py migrate` utilizando la terminal web del servicio Backend en Railway apuntando a tu base de datos de Railway principal.
2. **Migración Radius:** Asegúrate de ejecutar `freeradius/schema.sql` en tu Base de datos Radius. Para ello puedes usar un cliente externo (DBeaver o pgAdmin) usando la Public Networking URL del Postgres Radius, e importar el schema de FreeRADIUS.
3. **Admin User:** Dentro de tu Backend CLI, ejecuta `python manage.py createsuperuser` para poder iniciar sesión en tu Frontend Admin. 

---
Teniendo todo esto listo, la aplicación completa estará sirviendo mediante arquitecturas de contenedores aislados.
