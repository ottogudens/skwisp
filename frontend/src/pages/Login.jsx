import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch {
      toast.error('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">skwisp</span>
          <p className="login-subtitle">Panel de administración ISP</p>
        </div>

        <form className="login-form-inner" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="username" className="input-label">Usuario</label>
            <input
              id="username"
              className="input"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner spinner-sm" /> Ingresando…</> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
