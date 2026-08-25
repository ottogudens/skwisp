import { Link } from 'react-router-dom';
import { usePortalAuth } from '../context/PortalAuthContext';
import './Home.css';

const STATUS_LABELS = {
  active:    { label: 'Activo',              cls: 'active'    },
  suspended: { label: 'Suspendido',          cls: 'suspended' },
  cancelled: { label: 'Dado de baja',        cls: 'cancelled' },
  pending:   { label: 'Pendiente instalación', cls: 'pending' },
};

function StatusCard({ status }) {
  const { label, cls } = STATUS_LABELS[status] || { label: status, cls: 'pending' };
  return (
    <div className={`status-card status-card--${cls}`}>
      <span className="status-card-icon">
        {status === 'active' ? '🟢' : status === 'suspended' ? '🟡' : '🔴'}
      </span>
      <div>
        <p className="status-card-label">Estado de conexión</p>
        <p className="status-card-value">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { portalUser, clientData } = usePortalAuth();

  // Mientras carga clientData mostramos datos básicos del login
  const name    = clientData
    ? `${clientData.first_name} ${clientData.last_name}`
    : portalUser?.client_name ?? '…';
  const plan    = clientData?.plan?.name ?? portalUser?.plan_name ?? '…';
  const cstatus = clientData?.status     ?? portalUser?.client_status ?? 'pending';
  const pppoe   = clientData?.credential?.pppoe_username ?? null;

  // Próxima factura pendiente (viene de clientData.invoices si se expande el serializer)
  // Por ahora mostramos CTA para ir a facturas
  const nextInvoice = null; // Se cargará en InvoiceList

  return (
    <div className="home-page page-content">
      {/* Saludo */}
      <div className="home-greeting">
        <h1 className="home-name">👋 Hola, {name.split(' ')[0]}</h1>
        <p className="home-plan">Plan: <strong>{plan}</strong></p>
      </div>

      {/* Estado de conexión */}
      <StatusCard status={cstatus} />

      {/* Datos PPPoE */}
      {pppoe && (
        <div className="card home-pppoe-card">
          <p className="section-title">Tu conexión PPPoE</p>
          <p className="home-pppoe-user">
            <span className="home-pppoe-icon">📡</span>
            <code>{pppoe}</code>
          </p>
        </div>
      )}

      {/* Próxima boleta a pagar */}
      {clientData?.recent_invoices && clientData.recent_invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length > 0 && (() => {
        const pendingInv = clientData.recent_invoices.filter(i => i.status === 'pending' || i.status === 'overdue')[0];
        return (
          <div className="card" style={{ borderColor: pendingInv.status === 'overdue' ? 'var(--color-danger)' : 'var(--color-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p className="section-title" style={{ margin: 0, color: pendingInv.status === 'overdue' ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                {pendingInv.status === 'overdue' ? '⚠️ Boleta vencida' : 'Boleta pendiente'}
              </p>
              <strong style={{ fontSize: 'var(--text-lg)' }}>
                ${pendingInv.amount?.toLocaleString('es-CL')}
              </strong>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Período: {MONTHS[pendingInv.period_month - 1]} {pendingInv.period_year} — Vence: {pendingInv.due_date}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
               <Link className="btn btn-primary btn-full" to="/invoices">💳 Pagar</Link>
            </div>
          </div>
        );
      })()}

      {/* CTA de facturas */}
      <Link to="/invoices" className="home-cta-card card">
        <div className="home-cta-content">
          <span className="home-cta-icon">🧾</span>
          <div>
            <p className="home-cta-title">Mis facturas</p>
            <p className="home-cta-desc">Ver historial y pagar online</p>
          </div>
        </div>
        <span className="home-cta-arrow">→</span>
      </Link>

      {/* CTA de soporte */}
      <Link to="/tickets" className="home-cta-card card">
        <div className="home-cta-content">
          <span className="home-cta-icon">🎫</span>
          <div>
            <p className="home-cta-title">Soporte técnico</p>
            <p className="home-cta-desc">Reportar problemas o consultas</p>
          </div>
        </div>
        <span className="home-cta-arrow">→</span>
      </Link>
    </div>
  );
}
