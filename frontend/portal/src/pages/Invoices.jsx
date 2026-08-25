import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getInvoices, createPayment } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import './Invoices.css';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
}

function InvoiceBadge({ status }) {
  const labels = { pending: 'Pendiente', paid: 'Pagada', overdue: 'Vencida', cancelled: 'Anulada' };
  return <span className={`badge badge-${status}`}>{labels[status] ?? status}</span>;
}

export default function Invoices() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const pollingRef = useRef(null);

  const fetchInvoices = async () => {
    try {
      const res = await getInvoices();
      setInvoices(res.data.results ?? res.data);
    } catch {
      toast.error('No se pudieron cargar las facturas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Si viene de un pago, mostrar toast y refrescar durante 2 min
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('¡Pago recibido! Actualizando estado…');
      let count = 0;
      pollingRef.current = setInterval(() => {
        fetchInvoices();
        count++;
        if (count >= 24) clearInterval(pollingRef.current); // 24 × 5s = 2 min
      }, 5000);
    } else if (paymentStatus === 'failure') {
      toast.error('El pago no pudo completarse. Intenta nuevamente.');
    }

    return () => clearInterval(pollingRef.current);
  }, []); // eslint-disable-line

  const handlePay = async (invoice) => {
    setPayingId(invoice.id);
    try {
      const res = await createPayment(invoice.id);
      const url = res.data.init_point ?? res.data.sandbox_init_point;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('No se obtuvo la URL de pago. Contacta soporte.');
      }
    } catch {
      toast.error('Error al generar el link de pago.');
    } finally {
      setPayingId(null);
    }
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      const { data } = await downloadInvoicePdf(invoice.id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boleta_${invoice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Descargando tu boleta...');
    } catch {
      toast.error('Gud no pudo descargar el PDF de la boleta.');
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="spinner-center"><div className="spinner spinner-lg" /></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1 className="page-title">Mis facturas</h1>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🧾</span>
          <p className="empty-state-title">Sin facturas aún</p>
          <p className="empty-state-desc">Aquí aparecerán tus boletas mensuales de servicio.</p>
        </div>
      ) : (
        <div className="invoice-list">
          {invoices.map((inv) => (
            <div key={inv.id} className="invoice-card card">
              <div className="invoice-card-header">
                <div>
                  <p className="invoice-period">
                    {MONTHS[(inv.period_month - 1)]} {inv.period_year}
                  </p>
                  <p className="invoice-amount">{formatCLP(inv.amount)}</p>
                </div>
                <InvoiceBadge status={inv.status} />
              </div>

              <div className="invoice-card-meta">
                {inv.status === 'paid' && inv.paid_at && (
                  <p className="invoice-meta-item">
                    ✓ Pagada el {new Date(inv.paid_at).toLocaleDateString('es-CL')}
                  </p>
                )}
                {inv.status !== 'paid' && (
                  <p className="invoice-meta-item">
                    Vence: {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => handleDownloadPdf(inv)}
                  id={`download-pdf-${inv.id}`}
                >
                  📄 PDF
                </button>
                {(inv.status === 'pending' || inv.status === 'overdue') && (
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handlePay(inv)}
                    disabled={payingId === inv.id}
                    id={`pay-invoice-${inv.id}`}
                  >
                    {payingId === inv.id
                      ? <><span className="spinner spinner-sm" /> Redirigiendo…</>
                      : '💳 Pagar'
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
