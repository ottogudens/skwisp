import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import './Tickets.css';

const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
const STATUS_LABELS   = { open: 'Abierto', in_progress: 'En proceso', resolved: 'Resuelto', closed: 'Cerrado' };

function TicketCard({ ticket }) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="ticket-card card">
      <div className="ticket-card-top">
        <span className={`badge badge-${ticket.status}`}>{STATUS_LABELS[ticket.status] ?? ticket.status}</span>
        <span className={`priority-dot priority-dot--${ticket.priority}`} title={PRIORITY_LABELS[ticket.priority]}>
          {PRIORITY_LABELS[ticket.priority]}
        </span>
      </div>
      <p className="ticket-title">{ticket.title}</p>
      <p className="ticket-date">{new Date(ticket.created_at).toLocaleDateString('es-CL')}</p>
    </Link>
  );
}

export default function Tickets() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickets()
      .then((res) => setTickets(res.data.results ?? res.data))
      .catch(() => toast.error('No se pudieron cargar tus tickets.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) {
    return <div className="page-content spinner-center"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div className="page-content">
      <div className="tickets-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Soporte</h1>
        <Link to="/tickets/new" className="btn btn-primary" id="create-ticket-btn">+ Nuevo ticket</Link>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎫</span>
          <p className="empty-state-title">Sin reportes</p>
          <p className="empty-state-desc">¿Tienes algún problema? Abre un ticket y te ayudamos.</p>
          <Link to="/tickets/new" className="btn btn-primary">Abrir ticket</Link>
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  );
}
