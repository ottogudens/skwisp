import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getTickets, updateTicketStatus } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
const STATUS_LABELS   = { open: 'Abierto', in_progress: 'En proceso', resolved: 'Resuelto', closed: 'Cerrado' };

export default function TicketList() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState(searchParams.get('status') ?? '');
  const [priorityFilter, setPriority] = useState('');
  const [updatingId, setUpdatingId]   = useState(null);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    getTickets({
      status:   statusFilter   || undefined,
      priority: priorityFilter || undefined,
    })
      .then(({ data }) => setTickets(data.results ?? data))
      .catch(() => toast.error('No se pudieron cargar los tickets.'))
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]); // eslint-disable-line

  useEffect(() => {
    fetchTickets();
    setSearchParams({ ...(statusFilter && { status: statusFilter }) }, { replace: true });
  }, [statusFilter, priorityFilter]); // eslint-disable-line

  const handleUpdateStatus = async (e, ticket, newStatus) => {
    e.stopPropagation();
    setUpdatingId(ticket.id);
    try {
      await updateTicketStatus(ticket.id, newStatus);
      toast.success(`Ticket #${ticket.id} → ${STATUS_LABELS[newStatus]}`);
      fetchTickets();
    } catch {
      toast.error('No se pudo actualizar el ticket.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Soporte técnico</h1>
      </div>

      <div className="filters-bar">
        <select
          className="input"
          style={{ width: 'auto', flex: 'none' }}
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          id="ticket-status-filter"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          className="input"
          style={{ width: 'auto', flex: 'none' }}
          value={priorityFilter}
          onChange={(e) => setPriority(e.target.value)}
          id="ticket-priority-filter"
        >
          <option value="">Todas las prioridades</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading && <div className="spinner-center"><div className="spinner" /></div>}

      {!loading && tickets.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🎫</span>
          <p className="empty-state-title">Sin tickets</p>
          <p className="empty-state-desc">
            {statusFilter || priorityFilter ? 'Ningún ticket coincide con los filtros.' : 'No hay tickets registrados.'}
          </p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <>
          {/* Desktop */}
          <table className="data-table desktop-only">
            <thead>
              <tr><th>#</th><th>Título</th><th>Cliente</th><th>Prioridad</th><th>Estado</th><th>Asignado</th><th></th></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>#{t.id}</td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{t.title}</td>
                  <td>{t.client_name}</td>
                  <td><span className={`badge badge-${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span></td>
                  <td><span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span></td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{t.assigned_to_name ?? 'Sin asignar'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {t.status === 'open' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => handleUpdateStatus(e, t, 'in_progress')}
                        disabled={updatingId === t.id}
                        id={`take-ticket-${t.id}`}
                      >
                        {updatingId === t.id ? <span className="spinner spinner-sm" /> : 'Tomar'}
                      </button>
                    )}
                    {t.status === 'in_progress' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => handleUpdateStatus(e, t, 'resolved')}
                        disabled={updatingId === t.id}
                        id={`resolve-ticket-${t.id}`}
                      >
                        {updatingId === t.id ? <span className="spinner spinner-sm" /> : 'Resolver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="card-list mobile-only">
            {tickets.map((t) => (
              <div key={t.id} className="list-card" onClick={() => navigate(`/tickets/${t.id}`)}>
                <div className="list-card-header">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>#{t.id}</p>
                    <p className="list-card-title">{t.title}</p>
                  </div>
                  <span className={`badge badge-${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Cliente</span>
                  <span className="list-card-value">{t.client_name}</span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Estado</span>
                  <span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Asignado</span>
                  <span className="list-card-value">{t.assigned_to_name ?? 'Sin asignar'}</span>
                </div>
                {(t.status === 'open' || t.status === 'in_progress') && (
                  <div className="list-card-actions" onClick={(e) => e.stopPropagation()}>
                    {t.status === 'open' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => handleUpdateStatus(e, t, 'in_progress')}
                        disabled={updatingId === t.id}
                      >
                        Tomar ticket
                      </button>
                    )}
                    {t.status === 'in_progress' && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => handleUpdateStatus(e, t, 'resolved')}
                        disabled={updatingId === t.id}
                      >
                        Marcar resuelto
                      </button>
                    )}
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
