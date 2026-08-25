import { usePortalAuth } from '../context/PortalAuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function ProfileRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}</span>
      <span className="profile-row-value">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { portalUser, clientData, logout } = usePortalAuth();
  const navigate = useNavigate();

  const client = clientData;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="page-content">
      <h1 className="page-title">Mi perfil</h1>

      {/* Datos personales */}
      <section className="profile-section card" aria-label="Datos personales">
        <p className="section-title">Datos personales</p>
        <ProfileRow label="Nombre"    value={client ? `${client.first_name} ${client.last_name}` : portalUser?.client_name} />
        <ProfileRow label="RUT"       value={portalUser?.rut} />
        <ProfileRow label="Email"     value={client?.email} />
        <ProfileRow label="Teléfono"  value={client?.phone} />
        <ProfileRow label="Dirección" value={client?.address} />
      </section>

      {/* Plan */}
      <section className="profile-section card" aria-label="Mi plan">
        <p className="section-title">Mi plan</p>
        <ProfileRow label="Plan"       value={client?.plan?.name ?? portalUser?.plan_name} />
        <ProfileRow label="Velocidad"  value={client?.plan ? `↓ ${client.plan.download_speed} Mbps / ↑ ${client.plan.upload_speed} Mbps` : null} />
        <ProfileRow label="Estado"     value={client?.status ? { active: '🟢 Activo', suspended: '🟡 Suspendido', cancelled: '🔴 Dado de baja', pending: '🔵 Pendiente instalación' }[client.status] : null} />
      </section>

      {/* Credenciales PPPoE */}
      {client?.credential && (
        <section className="profile-section card" aria-label="Datos de conexión">
          <p className="section-title">Datos de conexión PPPoE</p>
          <ProfileRow label="Usuario" value={client.credential.pppoe_username} />
          <div className="profile-row">
            <span className="profile-row-label">Contraseña</span>
            <span className="profile-row-value profile-row-password">••••••••</span>
          </div>
        </section>
      )}

      {/* Cerrar sesión */}
      <div className="profile-logout">
        <button className="btn btn-secondary btn-full" onClick={handleLogout} id="portal-logout-btn">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
