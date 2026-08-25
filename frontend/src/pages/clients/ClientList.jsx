import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getClients, suspendClient, reactivateClient } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const STATUS_LABELS = {
  active:    'Activo',
  suspended: 'Suspendido',
  cancelled: 'Dado de baja',
  pending:   'Pendiente instalación',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS);

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ClientList() {
  const toast    = useToast();
  const confirm  = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null);
  const [search, setSearch]         = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatus]   = useState(searchParams.get('status') ?? '');
  const searchRef = useRef(search);
  searchRef.current = search;

  const debouncedSearch = useDebounce(search);

  const fetchClients = useCallback(() => {
    setLoading(true);
    getClients({ search: debouncedSearch || undefined, status: statusFilter || undefined })
      .then(({ data }) => setClients(data.results ?? data))
      .catch(() => toast.error('No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, statusFilter]); // eslint-disable-line

  useEffect(() => {
    fetchClients();
    setSearchParams(
      { ...(debouncedSearch && { search: debouncedSearch }), ...(statusFilter && { status: statusFilter }) },
      { replace: true }
    );
  }, [debouncedSearch, statusFilter]); // eslint-disable-line

  const handleToggle = async (client) => {
    const isSuspending = client.status === 'active';
    const ok = await confirm({
      title:        isSuspending ? '¿Suspender cliente?' : '¿Reactivar cliente?',
      message:      isSuspending
        ? `${client.first_name} ${client.last_name} perderá el acceso a internet inmediatamente.`
        : `${client.first_name} ${client.last_name} recuperará el acceso vía RADIUS.`,
      confirmLabel: isSuspending ? 'Suspender' : 'Reactivar',
      variant:      isSuspending ? 'danger' : 'primary',
    });
    if (!ok) return;

    setActionId(client.id);
    try {
      if (isSuspending) { await suspendClient(client.id);    toast.warning(`${client.first_name} suspendido.`); }
      else              { await reactivateClient(client.id); toast.success(`${client.first_name} reactivado.`); }
      fetchClients();
    } catch {
      toast.error('No se pudo cambiar el estado. Revisa los logs de RADIUS.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <div className="page-header-actions">
          <Link className="btn btn-secondary" to="/clients/map" id="map-client-btn">🗺️ Ver Mapa</Link>
          <Link className="btn btn-primary" to="/clients/new" id="new-client-btn">+ Nuevo cliente</Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <input
          className="input"
          placeholder="Buscar nombre, RUT, dirección…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="client-search"
        />
        <select
          className="input"
          style={{ width: 'auto', flex: 'none' }}
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          id="client-status-filter"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && <div className="spinner-center"><div className="spinner" /></div>}

      {/* Sin resultados */}
      {!loading && clients.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">👥</span>
          <p className="empty-state-title">Sin clientes</p>
          <p className="empty-state-desc">
            {search || statusFilter ? 'Ningún cliente coincide con los filtros aplicados.' : 'Aún no hay clientes registrados.'}
          </p>
          {!search && !statusFilter && (
            <Link to="/clients/new" className="btn btn-primary">Registrar cliente</Link>
          )}
        </div>
      )}

      {/* Desktop: tabla */}
      {!loading && clients.length > 0 && (
        <>
          <table className="data-table desktop-only">
            <thead>
              <tr>
                <th>Cliente</th><th>RUT</th><th>Plan</th><th>Estado</th><th>Dirección</th><th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                  <td style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{c.rut}</td>
                  <td>{c.plan_name}</td>
                  <td><span className={`badge badge-${c.status}`}>{STATUS_LABELS[c.status]}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {(c.status === 'active' || c.status === 'suspended') && (
                      <button
                        className={`btn btn-sm ${c.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleToggle(c)}
                        disabled={actionId === c.id}
                        id={`toggle-client-${c.id}`}
                      >
                        {actionId === c.id
                          ? <span className="spinner spinner-sm" />
                          : c.status === 'active' ? 'Suspender' : 'Reactivar'
                        }
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: cards */}
          <div className="card-list mobile-only">
            {clients.map((c) => (
              <div key={c.id} className="list-card" onClick={() => navigate(`/clients/${c.id}`)}>
                <div className="list-card-header">
                  <div>
                    <p className="list-card-title">{c.first_name} {c.last_name}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{c.rut}</p>
                  </div>
                  <span className={`badge badge-${c.status}`}>{STATUS_LABELS[c.status]}</span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Plan</span>
                  <span className="list-card-value">{c.plan_name}</span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Dirección</span>
                  <span className="list-card-value" style={{ textAlign: 'right', maxWidth: '60%' }}>{c.address}</span>
                </div>
                {(c.status === 'active' || c.status === 'suspended') && (
                  <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`btn btn-sm ${c.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ flex: 1 }}
                      onClick={() => handleToggle(c)}
                      disabled={actionId === c.id}
                    >
                      {actionId === c.id ? <span className="spinner spinner-sm" /> : c.status === 'active' ? 'Suspender' : 'Reactivar'}
                    </button>
                    <Link
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      to={`/clients/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver detalle
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
