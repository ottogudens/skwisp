import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClient, forceSyncClient, downloadInvoicePdf } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const STATUS_LABELS = {
  active: 'Activo', suspended: 'Suspendido', cancelled: 'Dado de baja', pending: 'Pendiente',
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const TABS = ['Información', 'PPPoE', 'Boletas', 'Tickets'];

function InfoRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--color-border)',
      gap: 'var(--sp-4)', fontSize: 'var(--text-sm)',
    }}>
      <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const toast   = useToast();
  const confirm = useConfirm();
  const [client, setClient]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setTab]   = useState(0);

  const fetchClient = useCallback(() => {
    setLoading(true);
    getClient(id)
      .then(({ data }) => setClient(data))
      .catch(() => toast.error('No se pudo cargar el cliente.'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  useEffect(() => { fetchClient(); }, [fetchClient]);

  const handleForceSync = async () => {
    const ok = await confirm({
      title: 'Forzar sincronización RADIUS',
      message: 'Se enviará el estado actual del cliente a FreeRADIUS. ¿Continuar?',
      confirmLabel: 'Sincronizar',
      variant: 'primary',
    });
    if (!ok) return;
    setSyncing(true);
    try {
      await forceSyncClient(id);
      toast.success('Sincronización con RADIUS completada.');
      fetchClient();
    } catch {
      toast.error('Error al sincronizar. Revisa los RadiusSyncLogs.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;
  if (!client) return null;

  const fullName = `${client.first_name} ${client.last_name}`;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
            <Link to="/clients" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              ← Clientes
            </Link>
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            {fullName}
            <span className={`badge badge-${client.status}`}>{STATUS_LABELS[client.status]}</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--sp-1)' }}>
            {client.plan_name}
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-secondary btn-sm" to={`/clients/${id}/edit`} id="edit-client-btn">Editar</Link>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleForceSync}
            disabled={syncing}
            id="force-sync-btn"
          >
            {syncing ? <><span className="spinner spinner-sm" /> Sincronizando…</> : '📡 Sync RADIUS'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
            id={`tab-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 0 — Información general */}
      {activeTab === 0 && (
        <div className="card">
          <InfoRow label="RUT"              value={client.rut} />
          <InfoRow label="Teléfono"         value={client.phone} />
          <InfoRow label="Email"            value={client.email} />
          <InfoRow label="Dirección"        value={client.address} />
          <InfoRow label="Plan"             value={client.plan_name} />
          <InfoRow label="Estado"           value={STATUS_LABELS[client.status]} />
          <InfoRow label="Día de facturación" value={client.billing_day ? `Día ${client.billing_day}` : null} />
          {client.latitude  && <InfoRow label="Latitud"  value={client.latitude} />}
          {client.longitude && <InfoRow label="Longitud" value={client.longitude} />}
        </div>
      )}

      {/* Tab 1 — PPPoE */}
      {activeTab === 1 && (
        <div className="card">
          {client.credential ? (
            <>
              <InfoRow label="Usuario PPPoE"   value={client.credential.pppoe_username} />
              <InfoRow label="NAS IP"          value={client.credential.nas_ip} />
              <InfoRow label="NAS Port ID"     value={client.credential.nas_port_id} />
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">📡</span>
              <p className="empty-state-title">Sin credenciales</p>
              <p className="empty-state-desc">Este cliente no tiene un usuario PPPoE asignado.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2 — Boletas */}
      {activeTab === 2 && (() => {
        const invoices = client.recent_invoices ?? [];

        const handleDownloadPdf = async (e, inv) => {
          e.stopPropagation();
          try {
            const response = await downloadInvoicePdf(inv.id);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `boleta_${inv.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Boleta descargada.');
          } catch {
            toast.error('Gud no pudo descargar el PDF.');
          }
        };

        return invoices.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🧾</span>
            <p className="empty-state-title">Sin boletas</p>
          </div>
        ) : (
          <>
            <table className="data-table desktop-only">
              <thead><tr><th>Período</th><th>Monto</th><th>Estado</th><th>Vencimiento</th><th></th></tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{MONTHS[inv.period_month - 1]} {inv.period_year}</td>
                    <td>${inv.amount?.toLocaleString('es-CL')}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td>{inv.due_date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => handleDownloadPdf(e, inv)}
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card-list mobile-only">
              {invoices.map((inv) => (
                <div key={inv.id} className="list-card">
                  <div className="list-card-header">
                    <p className="list-card-title">{MONTHS[inv.period_month - 1]} {inv.period_year}</p>
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                  </div>
                  <div className="list-card-row">
                    <span className="list-card-label">Monto</span>
                    <span className="list-card-value">${inv.amount?.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="list-card-row">
                    <span className="list-card-label">Vence</span>
                    <span className="list-card-value">{inv.due_date}</span>
                  </div>
                  <div className="list-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={(e) => handleDownloadPdf(e, inv)}
                    >
                      📄 Descargar PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* Tab 3 — Tickets */}
      {activeTab === 3 && (() => {
        const tickets = client.recent_tickets ?? [];
        return tickets.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎫</span>
            <p className="empty-state-title">Sin tickets</p>
          </div>
        ) : (
          <div className="card-list">
            {tickets.map((t) => (
              <Link key={t.id} to={`/tickets/${t.id}`} style={{ textDecoration: 'none' }}>
                <div className="list-card">
                  <div className="list-card-header">
                    <p className="list-card-title">{t.title}</p>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                  </div>
                  <div className="list-card-row">
                    <span className="list-card-label">Prioridad</span>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
