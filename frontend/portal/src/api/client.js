import axios from 'axios';

const portalClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/portal`
    : 'http://localhost:8000/api/portal',
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token de portal en cada request
portalClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  if (token) {
    config.headers.Authorization = `PortalToken ${token}`;
  }
  return config;
});

// Manejo global de errores
portalClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      window.location.href = '/login';
    }
    if (error.response?.status >= 500) {
      window.dispatchEvent(
        new CustomEvent('portal-api-error', {
          detail: { message: 'Error del servidor. Intenta nuevamente.' },
        })
      );
    }
    return Promise.reject(error);
  }
);

export default portalClient;
