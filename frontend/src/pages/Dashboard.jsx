import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../api/endpoints';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => setError('No se pudo cargar el resumen'));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p>Cargando...</p>;

  const cards = [
    { label: 'Clientes activos', value: summary.active_clients },
    { label: 'Clientes suspendidos', value: summary.suspended_clients },
    { label: 'Boletas pendientes', value: summary.pending_invoices },
    { label: 'Boletas vencidas', value: summary.overdue_invoices },
    { label: 'Tickets abiertos', value: summary.open_tickets },
    { label: 'Ingresos del mes (CLP)', value: summary.monthly_revenue?.toLocaleString('es-CL') },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card-grid">
        {cards.map((c) => (
          <div className="metric-card" key={c.label}>
            <span className="metric-value">{c.value ?? '—'}</span>
            <span className="metric-label">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
