import { useEffect, useState } from 'react';
import { getRadiusSyncLogs } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function RadiusSyncLogs() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRadiusSyncLogs({ success: onlyErrors ? false : undefined })
      .then(({ data }) => setLogs(data.results ?? data))
      .catch(() => toast.error('No se pudieron cargar los logs de RADIUS.'))
      .finally(() => setLoading(false));
  }, [onlyErrors]); // eslint-disable-line

  return (
    <div>
      <div className="page-header">
        <h1>RADIUS / Sincronización</h1>
      </div>

      <div className="filters-bar" style={{ display: 'flex', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={onlyErrors}
            onChange={(e) => setOnlyErrors(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Mostrar solo errores
        </label>
      </div>

      {loading && <div className="spinner-center"><div className="spinner" /></div>}

      {!loading && logs.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📡</span>
          <p className="empty-state-title">Sin registros</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <>
          {/* Desktop */}
          <table className="data-table desktop-only">
            <thead>
              <tr><th># Log</th><th>Fecha</th><th>Cliente</th><th>Acción</th><th>Estado</th><th>Detalle</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{log.id}</td>
                  <td>{new Date(log.synced_at).toLocaleString('es-CL')}</td>
                  <td style={{ fontWeight: 500 }}>{log.client_name}</td>
                  <td><span className="badge badge-low">{log.action}</span></td>
                  <td>
                    {log.success ? <span className="badge badge-success">Éxito</span> : <span className="badge badge-error">Falló</span>}
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', color: log.success ? 'var(--color-text-secondary)' : 'var(--color-danger)' }}>
                    {log.error_message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="card-list mobile-only">
            {logs.map((log) => (
              <div key={log.id} className="list-card">
                <div className="list-card-header">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      #{log.id} · {new Date(log.synced_at).toLocaleString('es-CL')}
                    </p>
                    <p className="list-card-title">{log.client_name}</p>
                  </div>
                  {log.success ? <span className="badge badge-success">OK</span> : <span className="badge badge-error">Falló</span>}
                </div>
                <div className="list-card-row">
                  <span className="list-card-label">Acción</span>
                  <span className="badge badge-low">{log.action}</span>
                </div>
                {!log.success && (
                  <div className="list-card-row" style={{ display: 'block', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-2)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', whiteSpace: 'pre-wrap' }}>
                      {log.error_message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
