import { useEffect, useState, useCallback } from 'react';
import { getEquipment } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const TYPE_LABELS = { onu: 'ONU', router: 'Router CPE', antenna: 'Antena' };
const STATUS_LABELS = {
  in_stock: 'En stock', installed: 'Instalado', maintenance: 'Mantenimiento', retired: 'De baja'
};

export default function EquipmentList() {
  const toast = useToast();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const fetchEquipment = useCallback(() => {
    setLoading(true);
    getEquipment({ search: search || undefined })
      .then(({ data }) => setEquipment(data.results ?? data))
      .catch(() => toast.error('No se pudo cargar el inventario.'))
      .finally(() => setLoading(false));
  }, [search]); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(t);
  }, [fetchEquipment]);

  return (
    <div>
      <div className="page-header">
        <h1>Inventario</h1>
        <button className="btn btn-primary">+ Nuevo equipo</button>
      </div>

      <div className="filters-bar">
        <input
          className="input"
          placeholder="Buscar por MAC, N° Serie o Marca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="spinner-center"><div className="spinner" /></div>}

      {!loading && equipment.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📦</span>
          <p className="empty-state-title">Sin equipos</p>
          <p className="empty-state-desc">
            {search ? 'Sin coincidencias.' : 'Aún no hay equipos en el inventario.'}
          </p>
        </div>
      )}

      {!loading && equipment.length > 0 && (
        <>
          {/* Desktop */}
          <table className="data-table desktop-only">
            <thead>
              <tr><th>Tipo</th><th>Marca/Modelo</th><th>MAC / N° Serie</th><th>Estado</th><th>Cliente</th></tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (
                <tr key={eq.id}>
                  <td>{TYPE_LABELS[eq.equipment_type] ?? eq.equipment_type}</td>
                  <td style={{ fontWeight: 500 }}>{eq.brand} {eq.model}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {eq.mac_address || eq.serial_number || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${eq.status === 'in_stock' ? 'active' : eq.status === 'installed' ? 'info' : 'low'}`}>
                      {STATUS_LABELS[eq.status] ?? eq.status}
                    </span>
                  </td>
                  <td>{eq.assigned_client_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="card-list mobile-only">
            {equipment.map((eq) => (
              <div key={eq.id} className="list-card">
                <div className="list-card-header">
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      {TYPE_LABELS[eq.equipment_type] ?? eq.equipment_type}
                    </p>
                    <p className="list-card-title">{eq.brand} {eq.model}</p>
                  </div>
                  <span className={`badge badge-${eq.status === 'in_stock' ? 'active' : eq.status === 'installed' ? 'info' : 'low'}`}>
                    {STATUS_LABELS[eq.status] ?? eq.status}
                  </span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Identificador</span>
                  <span className="list-card-value" style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                    {eq.mac_address || eq.serial_number || '—'}
                  </span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Cliente</span>
                  <span className="list-card-value">{eq.assigned_client_name || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
