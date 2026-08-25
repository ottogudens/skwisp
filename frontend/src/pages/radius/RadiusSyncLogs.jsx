import { useEffect, useState } from 'react';
import { getRadiusSyncLogs } from '../../api/endpoints';

export default function RadiusSyncLogs() {
  const [logs, setLogs] = useState([]);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRadiusSyncLogs({ success: onlyErrors ? false : undefined })
      .then(({ data }) => setLogs(data.results ?? data))
      .finally(() => setLoading(false));
  }, [onlyErrors]);

  return (
    <div>
      <h1>RADIUS / Sincronización</h1>

      <label className="checkbox-filter">
        <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />
        Solo mostrar errores
      </label>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Cliente</th><th>Acción</th><th>Éxito</th><th>Error</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.client_name}</td>
                <td>{log.action}</td>
                <td>{log.success ? '✅' : '❌'}</td>
                <td>{log.error_message || '—'}</td>
                <td>{new Date(log.synced_at).toLocaleString('es-CL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
