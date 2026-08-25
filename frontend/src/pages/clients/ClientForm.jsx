import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, getPlans } from '../../api/endpoints';

const initialState = {
  first_name: '', last_name: '', rut: '', email: '', phone: '',
  address: '', plan: '', billing_day: 5,
  pppoe_username: '', pppoe_password: '',
};

export default function ClientForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans().then(({ data }) => setPlans(data.results ?? data));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await createClient(form);
      navigate(`/clients/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el cliente');
    }
  };

  return (
    <div>
      <h1>Nuevo cliente</h1>
      {error && <p className="error">{error}</p>}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input name="first_name" placeholder="Nombre" value={form.first_name} onChange={handleChange} required />
          <input name="last_name" placeholder="Apellido" value={form.last_name} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <input name="rut" placeholder="RUT" value={form.rut} onChange={handleChange} required />
          <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} required />
        </div>
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="address" placeholder="Dirección" value={form.address} onChange={handleChange} required />

        <div className="form-row">
          <select name="plan" value={form.plan} onChange={handleChange} required>
            <option value="">Seleccionar plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price?.toLocaleString('es-CL')}</option>
            ))}
          </select>
          <input
            type="number" min="1" max="28" name="billing_day"
            placeholder="Día de facturación" value={form.billing_day} onChange={handleChange}
          />
        </div>

        <h3>Credencial PPPoE</h3>
        <div className="form-row">
          <input name="pppoe_username" placeholder="Usuario PPPoE" value={form.pppoe_username} onChange={handleChange} required />
          <input name="pppoe_password" placeholder="Password PPPoE" value={form.pppoe_password} onChange={handleChange} required />
        </div>

        <button type="submit" className="btn-primary">Crear cliente</button>
      </form>
    </div>
  );
}
