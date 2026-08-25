import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortalAuthProvider, usePortalAuth } from './context/PortalAuthContext';
import { ToastProvider } from './context/ToastContext';
import PortalLayout from './layouts/PortalLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import Profile from './pages/Profile';

import TicketDetail from './pages/TicketDetail';

/** Protege rutas del portal — redirige a /login si no hay sesión activa */
function PrivateRoute({ children }) {
  const { portalUser, loading } = usePortalAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }
  return portalUser ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <PortalLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <PortalAuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </PortalAuthProvider>
  );
}
