import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalLogin } from '../api/endpoints';
import { usePortalAuth } from '../context/PortalAuthContext';
import { useToast } from '../context/ToastContext';
import './Login.css';

/** Formatea un RUT mientras el usuario escribe: 12345678 → 12345678-9 */
function formatRut(raw) {
  const cleaned = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length <= 1) return cleaned;
  const dv = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);
  return `${body}-${dv}`;
}

export default function Login() {
  const { login } = usePortalAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleRutChange = (e) => {
    setRut(formatRut(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rut || !password) {
      toast.error('Ingresa tu RUT y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const res = await portalLogin(rut, password);
      const { token, ...userData } = res.data;
      login(userData, token);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'RUT o contraseña incorrectos.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-brand">
          <span className="login-logo">skwisp</span>
          <p className="login-subtitle">Portal del cliente</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* RUT */}
          <div className="input-group">
            <label htmlFor="rut" className="input-label">RUT</label>
            <input
              id="rut"
              type="text"
              className="input"
              placeholder="12345678-9"
              value={rut}
              onChange={handleRutChange}
              maxLength={10}
              autoComplete="username"
              inputMode="text"
              autoCapitalize="characters"
              required
            />
          </div>

          {/* Contraseña */}
          <div className="input-group">
            <label htmlFor="password" className="input-label">Contraseña</label>
            <div className="input-password-wrapper">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'Ingresar'}
          </button>
        </form>

        <p className="login-help">
          ¿Problemas de acceso?{' '}
          <a href="tel:+56900000000">Llama a soporte técnico</a>
        </p>
      </div>
    </div>
  );
}
