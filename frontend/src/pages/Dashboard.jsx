import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { getDashboardSummary } from '../api/endpoints';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatCLP(n) {
  return n != null
    ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
    : '—';
}

function MetricCard({ icon, label, value, color, to }) {
  const content = (
    <div className="metric-card" style={{ '--accent-color': color }}>
      <span className="metric-icon">{icon}</span>
      <span className="metric-value" style={{ color }}>{value ?? '—'}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--r-md)', padding: '8px 12px', fontSize: 'var(--text-xs)',
    }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#22c55e', fontWeight: 700 }}>{formatCLP(payload[0].value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;
  }

  if (!summary) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <p className="empty-state-title">No se pudo cargar el dashboard</p>
      </div>
    );
  }

  const metrics = [
    { icon: '🟢', label: 'Clientes activos',    value: summary.active_clients,    color: '#22c55e', to: '/clients?status=active' },
    { icon: '🟡', label: 'Suspendidos',          value: summary.suspended_clients, color: '#f59e0b', to: '/clients?status=suspended' },
    { icon: '🔴', label: 'Boletas vencidas',     value: summary.overdue_invoices,  color: '#ef4444', to: '/billing?status=overdue' },
    { icon: '💰', label: 'Ingresos del mes',     value: formatCLP(summary.monthly_revenue), color: '#22c55e' },
    { icon: '🎫', label: 'Tickets abiertos',     value: summary.open_tickets,      color: '#3b82f6', to: '/tickets' },
    { icon: '🧾', label: 'Cobros pendientes',    value: summary.pending_invoices,  color: '#f59e0b', to: '/billing?status=pending' },
  ];

  // Historial mensual de ingresos (si el endpoint lo retorna)
  const revenueHistory = (summary.revenue_history ?? []).map((item) => ({
    name: `${MONTHS_SHORT[item.month - 1]} ${String(item.year).slice(-2)}`,
    amount: item.amount,
  }));

  // Últimos eventos
  const recentEvents = summary.recent_events ?? [];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/clients/new" className="btn btn-primary" id="new-client-btn">+ Nuevo cliente</Link>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--sp-3)',
        marginBottom: 'var(--sp-6)',
      }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Gráfica + Eventos recientes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--sp-4)',
      }}>

        {/* Gráfica de ingresos */}
        {revenueHistory.length > 0 && (
          <div className="card">
            <p className="section-title">Ingresos mensuales</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueHistory} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="amount"
                  stroke="#22c55e" strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Últimos eventos */}
        {recentEvents.length > 0 && (
          <div className="card">
            <p className="section-title">Actividad reciente</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {recentEvents.map((ev, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
                  paddingBottom: 'var(--sp-3)',
                  borderBottom: i < recentEvents.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{ev.icon ?? '📌'}</span>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{ev.title}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{ev.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
