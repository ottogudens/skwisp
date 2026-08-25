import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import './NewTicket.css';

const CATEGORIES = [
  { value: 'no_connection', label: '📵  Sin conexión / sin señal' },
  { value: 'slow_speed',    label: '🐢  Velocidad lenta' },
  { value: 'plan_change',   label: '📦  Solicitar cambio de plan' },
  { value: 'data_change',   label: '📋  Actualizar mis datos' },
  { value: 'other',         label: '💬  Otro motivo' },
];

export default function NewTicket() {
  const toast = useToast();
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCategory = CATEGORIES.find((c) => c.value === category);
  const title = selectedCategory ? selectedCategory.label.replace(/^.\s+/, '') : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) { toast.error('Selecciona el tipo de problema.'); return; }
    if (description.trim().length < 10) { toast.error('Describe el problema con al menos 10 caracteres.'); return; }

    setLoading(true);
    try {
      await createTicket({ title, description: description.trim(), category, priority: 'medium' });
      toast.success('Ticket enviado. Te responderemos pronto.');
      navigate('/tickets', { replace: true });
    } catch {
      toast.error('No se pudo enviar el ticket. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="new-ticket-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Nuevo reporte</h1>
      </div>

      <form className="new-ticket-form card" onSubmit={handleSubmit} noValidate>
        {/* Categoría */}
        <fieldset className="ticket-categories">
          <legend className="input-label">¿Cuál es el problema?</legend>
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className={`category-option ${category === cat.value ? 'category-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={category === cat.value}
                onChange={() => setCategory(cat.value)}
                className="sr-only"
              />
              {cat.label}
            </label>
          ))}
        </fieldset>

        {/* Descripción */}
        <div className="input-group">
          <label htmlFor="description" className="input-label">
            Cuéntanos más detalles
          </label>
          <textarea
            id="description"
            className="input textarea"
            placeholder="Descríbenos qué está pasando, desde cuándo y cualquier detalle relevante…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            minLength={10}
            maxLength={1000}
            required
          />
          <span className="input-hint">{description.length}/1000 caracteres</span>
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="submit-ticket">
          {loading ? <><span className="spinner spinner-sm" /> Enviando…</> : 'Enviar reporte'}
        </button>
      </form>
    </div>
  );
}
