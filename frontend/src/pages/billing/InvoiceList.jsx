import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, createPaymentPreference, downloadInvoicePdf } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const STATUS_LABELS = {
  pending: 'Pendiente', paid: 'Pagada', overdue: 'Vencida', cancelled: 'Anulada',
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

export default function InvoiceList() {
  const toast = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices]     = useState([]);
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [linkingId, setLinkingId]   = useState(null);

  const fetchInvoices = () => {
    setLoading(true);
    getInvoices({ status: statusFilter || undefined })
      .then(({ data }) => setInvoices(data.results ?? data))
      .catch(() => toast.error('No se pudieron cargar las boletas.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchInvoices, [statusFilter]); // eslint-disable-line

  const handleGenerateLink = async (e, inv) => {
    e.stopPropagation();
    setLinkingId(inv.id);
    try {
      const { data } = await createPaymentPreference(inv.id);
      window.open(data.init_point ?? data.sandbox_init_point, '_blank');
      toast.success('Link de pago generado y abierto.');
    } catch {
      toast.error('No se pudo generar el link de pago.');
    } finally {
      setLinkingId(null);
    }
  };

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
      toast.error('Gud no pudo descargar el PDF de la boleta.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Facturación</h1>
      </div>

      <div className="filters-bar">
        <select
          className="input"
          style={{ width: 'auto', flex: 'none' }}
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          id="invoice-status-filter"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading && <div className="spinner-center"><div className="spinner" /></div>}

      {!loading && invoices.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🧾</span>
          <p className="empty-state-title">Sin boletas</p>
          <p className="empty-state-desc">
            {statusFilter ? 'No hay boletas con ese estado.' : 'Aún no se han generado boletas.'}
          </p>
        </div>
      )}

      {!loading && invoices.length > 0 && (
        <>
          {/* Desktop */}
          <table className="data-table desktop-only">
            <thead>
              <tr><th>Cliente</th><th>Período</th><th>Monto</th><th>Estado</th><th>Vencimiento</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 500 }}>{inv.client_name}</td>
                  <td>{MONTHS[inv.period_month - 1]} {inv.period_year}</td>
                  <td style={{ fontWeight: 600 }}>{formatCLP(inv.amount)}</td>
                  <td><span className={`badge badge-${inv.status}`}>{STATUS_LABELS[inv.status]}</span></td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{inv.due_date}</td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => handleDownloadPdf(e, inv)}
                      id={`download-pdf-${inv.id}`}
                    >
                      📄 PDF
                    </button>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => handleGenerateLink(e, inv)}
                        disabled={linkingId === inv.id}
                        id={`pay-link-${inv.id}`}
                      >
                        {linkingId === inv.id ? <span className="spinner spinner-sm" /> : '💳 Pagar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="card-list mobile-only">
            {invoices.map((inv) => (
              <div key={inv.id} className="list-card">
                <div className="list-card-header">
                  <div>
                    <p className="list-card-title">{inv.client_name}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {MONTHS[inv.period_month - 1]} {inv.period_year}
                    </p>
                  </div>
                  <span className={`badge badge-${inv.status}`}>{STATUS_LABELS[inv.status]}</span>
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Monto</span>
                  <span className="list-card-value" style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                    {formatCLP(inv.amount)}
                  </span>
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
                    📄 PDF
                  </button>
                  {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={(e) => handleGenerateLink(e, inv)}
                      disabled={linkingId === inv.id}
                    >
                      {linkingId === inv.id ? <span className="spinner spinner-sm" /> : '💳 Pagar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
