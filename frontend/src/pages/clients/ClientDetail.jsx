import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getClient, forceSyncClient } from '../../api/endpoints';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchClient = () => getClient(id).then(({ data }) => setClient(data));

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleForceSync = async () => {
    setSyncMsg('Sincronizando...');
    try {
      await forceSyncClient(id);
      setSyncMsg('Sincronizado con RADIUS correctamente');
      fetchClient();
    } catch {
      setSyncMsg('Error al sincronizar — revisar RadiusSyncLog');
    }
  };

  if (!client) return <p>Cargando...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{client.first_name} {client.last_name}</h1>
        <button className="btn-secondary" onClick={handleForceSync}>Forzar sync RADIUS</button>
      </div>
      {syncMsg && <p className="sync-msg">{syncMsg}</p>}

      <section className="detail-grid">
        <div className="detail-block">
          <h3>Datos del cliente</h3>
          <p><strong>RUT:</strong> {client.rut}</p>
          <p><strong>Teléfono:</strong> {client.phone}</p>
          <p><strong>Email:</strong> {client.email || '—'}</p>
          <p><strong>Dirección:</strong> {client.address}</p>
          <p><strong>Plan:</strong> {client.plan_name}</p>
          <p><strong>Estado:</strong> {client.status}</p>
          <p><strong>Día de facturación:</strong> {client.billing_day}</p>
        </div>

        <div className="detail-block">
          <h3>Credencial PPPoE</h3>
          <p><strong>Usuario:</strong> {client.credential?.pppoe_username}</p>
          <p><strong>NAS:</strong> {client.credential?.nas_ip}</p>
        </div>
      </section>

      <section className="detail-block">
        <h3>Boletas recientes</h3>
        <table className="data-table">
          <thead>
            <tr><th>Periodo</th><th>Monto</th><th>Estado</th><th>Vencimiento</th></tr>
          </thead>
          <tbody>
            {(client.recent_invoices ?? []).map((inv) => (
              <tr key={inv.id}>
                <td>{inv.period_month}/{inv.period_year}</td>
                <td>${inv.amount?.toLocaleString('es-CL')}</td>
                <td>{inv.status}</td>
                <td>{inv.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
