import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createClient, updateClient, getClient, getPlans } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const initialState = {
  first_name: '', last_name: '', rut: '', email: '', phone: '',
  address: '', plan: '', billing_day: 5,
  pppoe_username: '', pppoe_password: '', status: 'pending',
};

export default function ClientForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(initialState);
  const [plans, setPlans] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p1 = getPlans().then(({ data }) => setPlans(data.results ?? data));
    const ops = [p1];

    if (isEditing) {
      ops.push(
        getClient(id).then(({ data }) => {
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            rut: data.rut || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            plan: data.plan || '',
            billing_day: data.billing_day || 5,
            pppoe_username: data.credential?.pppoe_username || '',
            pppoe_password: '', // No cargamos la password en edit por seguridad
            status: data.status || 'pending',
          });
        })
      );
    }

    Promise.all(ops)
      .catch(() => toast.error('Error al cargar datos.'))
      .finally(() => setLoadingConfig(false));
  }, [id, isEditing]); // eslint-disable-line

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        // En edit, solo mandamos password si fue modificada
        const dataToSave = { ...form };
        if (!dataToSave.pppoe_password) delete dataToSave.pppoe_password;
        await updateClient(id, dataToSave);
        toast.success('Cliente actualizado correctamente.');
        navigate(`/clients/${id}`);
      } else {
        const { data } = await createClient(form);
        toast.success('Cliente registrado correctamente.');
        navigate(`/clients/${data.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.detail 
        || JSON.stringify(err.response?.data) 
        || 'Error al guardar el cliente';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingConfig) {
    return <div className="spinner-center"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</h1>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
          type="button"
        >
          Cancelar
        </button>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <p className="section-title">Datos personales</p>
        <div className="form-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="input-group">
            <label className="input-label">Nombres</label>
            <input className="input" name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Apellidos</label>
            <input className="input" name="last_name" value={form.last_name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">RUT</label>
            <input className="input" name="rut" placeholder="12345678-9" value={form.rut} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Teléfono</label>
            <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="input-group full-width">
            <label className="input-label">Dirección</label>
            <input className="input" name="address" value={form.address} onChange={handleChange} required />
          </div>
        </div>

        <p className="section-title">Servicio y Facturación</p>
        <div className="form-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="input-group">
            <label className="input-label">Plan contratado</label>
            <select className="input" name="plan" value={form.plan} onChange={handleChange} required>
              <option value="">Seleccionar plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ${p.price?.toLocaleString('es-CL')}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Día de facturación</label>
            <input
              className="input" type="number" min="1" max="28" name="billing_day"
              value={form.billing_day} onChange={handleChange} required
            />
          </div>
          {isEditing && (
            <div className="input-group">
              <label className="input-label">Estado</label>
              <select className="input" name="status" value={form.status} onChange={handleChange}>
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
                <option value="cancelled">Dado de baja</option>
              </select>
            </div>
          )}
        </div>

        <p className="section-title">PPPoE (Router WiFi)</p>
        <div className="form-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="input-group">
            <label className="input-label">Usuario PPPoE</label>
            <input className="input" name="pppoe_username" value={form.pppoe_username} onChange={handleChange} required={!isEditing} />
          </div>
          <div className="input-group">
            <label className="input-label">Contraseña PPPoE</label>
            <input
              className="input" name="pppoe_password" type="text"
              placeholder={isEditing ? 'Deja en blanco para no cambiar' : 'Requerida'}
              value={form.pppoe_password} onChange={handleChange} required={!isEditing}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--sp-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner spinner-sm" /> Guardando…</> : isEditing ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
