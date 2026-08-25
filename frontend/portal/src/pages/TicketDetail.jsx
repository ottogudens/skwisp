import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTicket } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

const PRIORITIES = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
const STATUSES   = { open: 'Abierto', in_progress: 'En proceso', resolved: 'Resuelto', closed: 'Cerrado' };

export default function TicketDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTicket(id)
      .then((res) => setTicket(res.data))
      .catch(() => toast.error('Error al cargar el detalle del ticket.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="page-content spinner-center"><div className="spinner spinner-lg" /></div>;
  }

  if (!ticket) {
    return (
      <div className="page-content empty-state">
        <span className="empty-state-icon">❌</span>
        <p className="empty-state-title">Ticket no encontrado</p>
        <Link to="/tickets" className="btn btn-secondary mt-4">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Link to="/tickets" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
        ← Volver a tickets
      </Link>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className={`badge badge-${ticket.status}`}>{STATUSES[ticket.status] || ticket.status}</span>
          <span className={`priority-dot priority-dot--${ticket.priority}`}>{PRIORITIES[ticket.priority]}</span>
        </div>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{ticket.title}</h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Creado el: {new Date(ticket.created_at).toLocaleString('es-CL')}
        </p>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
          {ticket.description}
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: '24px' }}>Comentarios y Actualizaciones</h2>
      {ticket.comments?.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No hay comentarios en este ticket aún.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ticket.comments?.map(c => (
            <div key={c.id} className="card" style={{ padding: '12px 16px', background: 'var(--color-bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>{c.author_name} (Soporte)</strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>
                  {new Date(c.created_at).toLocaleString('es-CL')}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
