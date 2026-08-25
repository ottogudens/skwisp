import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  // state: { title, message, confirmLabel, variant, resolve }

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirmar', variant = 'danger' }) =>
    new Promise((resolve) => {
      setState({ title, message, confirmLabel, variant, resolve });
    }),
  []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={handleCancel} role="dialog" aria-modal="true">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{state.title}</p>
            <p className="modal-message">{state.message}</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCancel} id="modal-cancel">
                Cancelar
              </button>
              <button
                className={`btn btn-${state.variant}`}
                onClick={handleConfirm}
                id="modal-confirm"
                autoFocus
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
}
