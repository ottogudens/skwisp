import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);
let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (m) => addToast(m, 'success'),
    error:   (m) => addToast(m, 'error', 5000),
    info:    (m) => addToast(m, 'info'),
    warning: (m) => addToast(m, 'warning', 4500),
  };

  // Errores de servidor desde interceptor Axios
  useEffect(() => {
    const h = (e) => toast.error(e.detail?.message ?? 'Error del servidor');
    window.addEventListener('api-error', h);
    return () => window.removeEventListener('api-error', h);
  }, []); // eslint-disable-line

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>
              {t.type === 'success' && '✓'}
              {t.type === 'error'   && '✕'}
              {t.type === 'info'    && 'ℹ'}
              {t.type === 'warning' && '⚠'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
