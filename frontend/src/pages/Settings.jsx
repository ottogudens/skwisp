import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { updateClient } from '../api/endpoints'; // Usaremos esto simulado para settings o podemos dejarlo UI-only

export default function Settings() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'FibraPuconCore ISP',
    supportPhone: '+56 9 1234 5678',
    supportEmail: 'soporte@fibrapuconcore.cl',
    billingDay: 5,
    timezone: 'America/Santiago'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular guardado
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    toast.success('Configuración guardada correctamente.');
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1>Configuración</h1>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label className="input-label">Nombre de la Empresa</label>
            <input
              className="input"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Teléfono de Soporte</label>
            <input
              className="input"
              value={settings.supportPhone}
              onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Email de Soporte</label>
            <input
              className="input"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Día de Facturación global</label>
            <select
              className="input"
              value={settings.billingDay}
              onChange={(e) => setSettings({ ...settings, billingDay: Number(e.target.value) })}
            >
              {[1, 5, 10, 15, 20].map(d => <option key={d} value={d}>Día {d}</option>)}
            </select>
          </div>
          <div className="input-group full-width">
            <label className="input-label">Zona Horaria</label>
            <select
              className="input"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            >
              <option value="America/Santiago">America/Santiago (Chile)</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires (Argentina)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 'var(--sp-6)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Guardando…</> : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
