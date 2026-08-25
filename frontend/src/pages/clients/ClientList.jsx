import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClients, suspendClient, reactivateClient } from '../../api/endpoints';

const STATUS_LABELS = {
  active: 'Activo',
  suspended: 'Suspendido',
  cancelled: 'Dado de baja',
  pending: 'Pendiente instalación',
};

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClients = () => {
    setLoading(true);
    getClients({ search, status: statusFilter || undefined })
      .then(({ data }) => setClients(data.results ?? data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(fetchClients, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleToggleStatus = async (client) => {
    if (client.status === 'active') {
      await suspendClient(client.id);
    } else if (client.status === 'suspended') {
      await reactivateClient(client.id);
    }
    fetchClients();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <Link className="btn-primary" to="/clients/new">+ Nuevo cliente</Link>
      </div>

      <div className="filters">
        <input
          placeholder="Buscar por nombre, RUT o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>RUT</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Dirección</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <Link to={`/clients/${client.id}`}>
                    {client.first_name} {client.last_name}
                  </Link>
                </td>
                <td>{client.rut}</td>
                <td>{client.plan_name}</td>
                <td>
                  <span className={`badge badge-${client.status}`}>
                    {STATUS_LABELS[client.status]}
                  </span>
                </td>
                <td>{client.address}</td>
                <td>
                  {(client.status === 'active' || client.status === 'suspended') && (
                    <button className="btn-link" onClick={() => handleToggleStatus(client)}>
                      {client.status === 'active' ? 'Suspender' : 'Reactivar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
