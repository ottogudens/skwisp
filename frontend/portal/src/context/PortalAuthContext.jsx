import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/endpoints';

const PortalAuthContext = createContext(null);

export function PortalAuthProvider({ children }) {
  const [portalUser, setPortalUser] = useState(null); // { rut, client_name, client_status, plan_name, token }
  const [clientData, setClientData] = useState(null); // datos completos del cliente desde /me/
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('portal_user');
    const token = localStorage.getItem('portal_token');
    if (stored && token) {
      setPortalUser(JSON.parse(stored));
      // Cargar datos frescos del servidor
      getMe()
        .then((res) => setClientData(res.data.client))
        .catch(() => {
          // Token inválido — el interceptor de Axios ya redirigirá a /login
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData, token) => {
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_user', JSON.stringify(userData));
    setPortalUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    setPortalUser(null);
    setClientData(null);
  }, []);

  return (
    <PortalAuthContext.Provider value={{ portalUser, clientData, loading, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth debe usarse dentro de PortalAuthProvider');
  return ctx;
}
