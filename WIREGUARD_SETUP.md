# WireGuard — MikroTik y FreeRADIUS en la misma LAN virtual

Esta guía conecta los routers MikroTik (RB4011 de laboratorio, CCR1016 de producción) a
FreeRADIUS mediante un túnel WireGuard, de forma que todos queden en el mismo segmento de
red virtual (`10.10.10.0/24`) sin importar dónde esté físicamente cada uno.

## Por qué

- Resuelve la limitación documentada en `MANUAL_DESPLIEGUE_RAILWAY.md` §6.5: bajo el proxy
  UDP de Railway, FreeRADIUS nunca ve la IP pública real del router, así que restringir por
  IP en `clients.conf` no servía de nada.
- Con WireGuard, la IP que ve FreeRADIUS es siempre la IP interna fija del túnel
  (ej. `10.10.10.2`), sin importar si el router tiene IP pública dinámica, está detrás de
  CGNAT, o cambia de proveedor de internet.
- El tráfico RADIUS (UDP 1812/1813) viaja cifrado dentro del túnel — nadie en la ruta puede
  ver ni inyectar tráfico de autenticación PPPoE.

## Requisitos

- **RouterOS v7.0 o superior** en cada MikroTik. WireGuard es nativo desde RouterOS 7;
  **no existe en RouterOS 6.x**. Según lo registrado, `RB_Gudens` (RB4011) corre RouterOS
  6.49 — hay que actualizarlo antes de seguir esta guía.
- Un servidor/VPS propio para el hub WireGuard (el servicio `wireguard` del
  `docker-compose.yml`). **No se puede desplegar en Railway** — sus contenedores no tienen
  acceso a `/dev/net/tun` ni a `CAP_NET_ADMIN`, requisitos indispensables para crear una
  interfaz WireGuard. Una VPS pequeña (1 vCPU/1GB, cualquier proveedor) alcanza de sobra.

## 1. Levantar el hub WireGuard

En tu VPS (no en Railway):

```bash
cd skwisp
cp .env.example .env   # completar WIREGUARD_PUBLIC_HOST y WIREGUARD_UI_PASSWORD_HASH

# Generar el hash de la contraseña de la UI de administración:
docker run --rm ghcr.io/wg-easy/wg-easy:14 wgpw 'tu-password-aqui'
# Copiar el hash resultante a WIREGUARD_UI_PASSWORD_HASH en .env

docker compose up -d wireguard
```

La UI de administración queda en `http://127.0.0.1:51821` (solo local — si necesitas
acceso remoto, usa un túnel SSH: `ssh -L 51821:localhost:51821 usuario@tu-vps`).

## 2. Crear un peer por cada MikroTik

Desde la UI de wg-easy:

1. **+ New Client** → nombre `rb4011-lab`
2. wg-easy asigna automáticamente una IP interna (ej. `10.10.10.2`) y genera el par de
   claves — descarga la configuración (botón de descarga o código QR).
3. Repite para `ccr1016-core` cuando llegue el momento de producción.

Anota la IP asignada — la necesitarás para `RADIUS_RB4011_IP` en tu `.env` y para el
registro `NasDevice` en el panel admin.

## 3. Configurar WireGuard en el MikroTik (RouterOS 7+)

Con los datos del archivo de configuración descargado desde wg-easy (`PrivateKey`,
`PublicKey` del servidor, `Endpoint`, `AllowedIPs`):

```
/interface wireguard add name=wg-skwisp listen-port=51820

/interface wireguard peers add \
    interface=wg-skwisp \
    public-key="<PublicKey del servidor, mostrado en wg-easy>" \
    endpoint-address=<WIREGUARD_PUBLIC_HOST> \
    endpoint-port=51820 \
    allowed-address=10.10.10.0/24 \
    persistent-keepalive=25s

/ip address add address=10.10.10.2/24 interface=wg-skwisp

# Configurar la clave privada del propio router (la que generó wg-easy para este peer):
/interface wireguard set wg-skwisp private-key="<PrivateKey de este peer>"
```

`persistent-keepalive=25s` es importante: sin esto, si el router está detrás de NAT/CGNAT
(típico en conexiones residenciales o algunos enlaces de ISP), el túnel puede "dormirse" y
FreeRADIUS dejaría de recibir tráfico hasta que el router reintente activamente.

## 4. Validar el túnel

Desde el MikroTik:
```
/ping 10.10.10.1 interface=wg-skwisp
```
Si responde, el túnel está arriba y FreeRADIUS (que corre en el mismo namespace de red que
el contenedor `wireguard`, IP `10.10.10.1`) es alcanzable.

## 5. Apuntar el PPPoE server del MikroTik a FreeRADIUS por el túnel

```
/radius add service=ppp address=10.10.10.1 secret=<mismo secret que RADIUS_RB4011_SECRET> timeout=3s
/radius incoming set accept=yes port=3799
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
```

## 6. Completar en Django

1. `.env`: `RADIUS_RB4011_IP=10.10.10.2` (la IP que asignó wg-easy a este peer)
2. `freeradius/clients.conf`: ya usa `$ENV{RADIUS_RB4011_IP}`, no requiere cambios
3. En `/admin/` → RADIUS/Sync → Nas Devices: crea el registro con `ip_address=10.10.10.2`,
   `connection_type=wireguard`, `environment=lab` — puramente informativo, para tener
   trazabilidad de qué NAS existen sin tener que abrir `clients.conf` cada vez.

## Migración a producción (CCR1016)

Repite los pasos 2–6 con el CCR1016 (recordando actualizar su RouterOS a v7+ primero si aún
no lo está). Al tener ambos routers en la misma LAN virtual, puedes correr pruebas desde el
RB4011 sin ningún riesgo de tocar el tráfico de producción — son peers independientes del
mismo hub, con secrets RADIUS distintos.
