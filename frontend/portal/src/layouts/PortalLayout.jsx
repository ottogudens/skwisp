import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../context/PortalAuthContext';
import './PortalLayout.css';

const NAV_ITEMS = [
  { to: '/',        label: 'Inicio',   icon: '🏠', end: true },
  { to: '/invoices',label: 'Facturas', icon: '🧾' },
  { to: '/tickets', label: 'Soporte',  icon: '🎫' },
  { to: '/profile', label: 'Perfil',   icon: '👤' },
];

export default function PortalLayout() {
  const { portalUser, logout } = usePortalAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="portal-shell">
      {/* ── Header (mobile) ── */}
      <header className="portal-header">
        <div className="portal-header-brand">
          <span className="portal-logo">skwisp</span>
          <span className="portal-header-subtitle">Mi Portal</span>
        </div>
        <button className="portal-logout-btn" onClick={handleLogout} title="Cerrar sesión">
          Salir
        </button>
      </header>

      {/* ── Sidebar (tablet/desktop) ── */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-brand">
          <span className="portal-logo">skwisp</span>
          <span className="portal-sidebar-subtitle">Portal del cliente</span>
        </div>
        <nav className="portal-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `portal-nav-link ${isActive ? 'portal-nav-link--active' : ''}`
              }
            >
              <span className="portal-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="portal-sidebar-footer">
          <div className="portal-sidebar-user">
            <span className="portal-sidebar-username">{portalUser?.client_name}</span>
            <span className="portal-sidebar-rut">{portalUser?.rut}</span>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>Salir →</button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="portal-main">
        <Outlet />
      </main>

      {/* ── Bottom Tab Bar (mobile) ── */}
      <nav className="portal-bottom-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `portal-tab ${isActive ? 'portal-tab--active' : ''}`
            }
          >
            <span className="portal-tab-icon">{item.icon}</span>
            <span className="portal-tab-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
