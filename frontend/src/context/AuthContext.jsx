import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('skwisp_token');
    const storedUser = localStorage.getItem('skwisp_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await apiLogin(username, password);
    localStorage.setItem('skwisp_token', data.token);
    localStorage.setItem('skwisp_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('skwisp_token');
    localStorage.removeItem('skwisp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
