import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getClients } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

// Solución para iconos en react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_LABELS = {
  active: 'Activo',
  suspended: 'Suspendido',
  cancelled: 'Dado de baja',
  pending: 'Pendiente',
};

const mapStyle = {
  height: '70vh',
  width: '100%',
  borderRadius: 'var(--r-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
};

export default function CoverageMap() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([-39.27, -71.97]); // Coordenadas de ejemplo (Pucón)

  useEffect(() => {
    // Obtenemos a todos los clientes (podemos limitarlo o fltarlo por lat long no null)
    getClients({ limit: 1000 })
      .then(({ data }) => {
        const clientList = data.results ?? data;
        const validClients = clientList.filter(c => c.latitude && c.longitude);
        setClients(validClients);
        // Centramos autoamaticamente si hay clientes
        if (validClients.length > 0) {
          setCenter([validClients[0].latitude, validClients[0].longitude]);
        }
      })
      .catch(() => toast.error('No se pudieron cargar los datos del mapa.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <div>
      <div className="page-header">
        <h1>Mapa de Cobertura</h1>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner-center"><div className="spinner" /></div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🗺️</span>
            <p className="empty-state-title">Sin coordenadas</p>
            <p className="empty-state-desc">No hay clientes con latitud y longitud registradas.</p>
          </div>
        ) : (
          <MapContainer center={center} zoom={13} style={mapStyle} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clients.map(c => (
              <Marker key={c.id} position={[c.latitude, c.longitude]}>
                <Popup>
                  <strong>{c.first_name} {c.last_name}</strong><br/>
                  <span className={`badge badge-${c.status}`} style={{ margin: '4px 0', display: 'inline-block' }}>
                    {STATUS_LABELS[c.status]}
                  </span><br/>
                  <small>{c.address}</small><br/>
                  <a href={`/clients/${c.id}`} style={{ color: 'var(--color-accent)' }}>Ver ficha →</a>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
