# freeradius/Dockerfile
FROM freeradius/freeradius-server:3.2.5

# Copiar configuraciones locales al contenedor
COPY clients.conf /etc/raddb/clients.conf
COPY mods-enabled/sql /etc/raddb/mods-enabled/sql

# Exponer puertos estándar UDP
EXPOSE 1812/udp 1813/udp