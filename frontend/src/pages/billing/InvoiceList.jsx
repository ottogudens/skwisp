import { useEffect, useState } from 'react';
import { getInvoices, createPaymentPreference } from '../../api/endpoints';

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Anulada',
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = () => {
    setLoading(true);
    getInvoices({ status: statusFilter || undefined })
      .then(({ data }) => setInvoices(data.results ?? data))
      .finally(() => setLoading(false));
  };

  useEffect(fetchInvoices, [statusFilter]);

  const handleGenerateLink = async (invoice) => {
    const { data } = await createPaymentPreference(invoice.id);
    window.open(data.init_point, '_blank');
  };

  return (
    <div>
      <h1>Facturación</h1>

      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th><th>Periodo</th><th>Monto</th><th>Estado</th><th>Vencimiento</th><th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.client_name}</td>
                <td>{inv.period_month}/{inv.period_year}</td>
                <td>${inv.amount?.toLocaleString('es-CL')}</td>
                <td><span className={`badge badge-${inv.status}`}>{STATUS_LABELS[inv.status]}</span></td>
                <td>{inv.due_date}</td>
                <td>
                  {inv.status !== 'paid' && (
                    <button className="btn-link" onClick={() => handleGenerateLink(inv)}>
                      Generar link de pago
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
