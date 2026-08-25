import { useState, useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',    icon: '🏠', end: true },
  { to: '/clients',   label: 'Clientes',     icon: '👥' },
  { to: '/billing',   label: 'Facturación',  icon: '🧾' },
  { to: '/tickets',   label: 'Soporte',      icon: '🎫' },
  { to: '/inventory', label: 'Inventario',   icon: '📦' },
  { to: '/radius',    label: 'RADIUS / Sync',icon: '📡' },
  { to: '/settings',  label: 'Configuración',icon: '⚙️' },
];

/** Título de la página actual */
function useCurrentPageTitle() {
  const location = useLocation();
  const match = NAV_ITEMS.find(
    (item) => item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  );
  return match?.label ?? 'skwisp';
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pageTitle = useCurrentPageTitle();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? '→' : '←'}
          </button>
          {!collapsed && <span className="sidebar-brand">skwisp</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-dot" />
            {!collapsed && <span className="sidebar-username">{user?.username}</span>}
          </div>
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Cerrar sesión"
            id="admin-logout-btn"
          >
            {collapsed ? '↩' : 'Salir →'}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="admin-main-area">
        {/* Topbar (mobile) */}
        <header className="admin-topbar">
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Abrir menú"
            id="topbar-hamburger"
          >
            ☰
          </button>
          <span className="topbar-title">{pageTitle}</span>
          <span className="topbar-user">{user?.username}</span>
        </header>

        {/* Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
