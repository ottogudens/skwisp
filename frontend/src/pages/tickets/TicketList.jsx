import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../../api/endpoints';

const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };
const STATUS_LABELS = { open: 'Abierto', in_progress: 'En proceso', resolved: 'Resuelto', closed: 'Cerrado' };

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickets()
      .then(({ data }) => setTickets(data.results ?? data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Soporte técnico</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Ticket</th><th>Cliente</th><th>Prioridad</th><th>Estado</th><th>Asignado</th></tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td><Link to={`/tickets/${t.id}`}>{t.title}</Link></td>
                <td>{t.client_name}</td>
                <td><span className={`badge badge-priority-${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span></td>
                <td>{STATUS_LABELS[t.status]}</td>
                <td>{t.assigned_to_name || 'Sin asignar'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
