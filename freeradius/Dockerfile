# freeradius/Dockerfile
FROM freeradius/freeradius-server:3.2.5

# Copiar el archivo de ejemplo a clients.conf (leerá la variable RADIUS_CLIENT_SECRET)
COPY clients.conf.example /etc/raddb/clients.conf

# Habilitar el módulo SQL nativamente mediante enlace simbólico
RUN ln -s /etc/raddb/mods-available/sql /etc/raddb/mods-enabled/sql || true

# Exponer puertos estándar UDP
EXPOSE 1812/udp 1813/udp