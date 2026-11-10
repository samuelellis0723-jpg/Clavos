import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import brandMarkUrl from '../assets/clavos-mark.svg';

/* SVG Icons for navigation */
function IconMenu({ open }) {
  return open ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconFileText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export default function AppShell({ children }) {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isOpsSection = location.pathname.startsWith('/app');

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'OP';

  return (
    <div className={`app-shell ${isOpsSection ? 'is-ops' : 'is-public'}`}>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <header className={`site-header ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className={`site-header-inner ${isOpsSection ? '' : 'wrap'}`}>
          <Link
            to="/"
            className="brand"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Ferretería Clavos — Inicio"
          >
            <img src={brandMarkUrl} alt="" className="brand-mark" width="34" height="34" />
            <div>
              <span className="brand-word">
                Clavos<span className="dot">.</span>
              </span>
              <span className="brand-tag">Ferretería &amp; Abastecimiento</span>
            </div>
          </Link>

          <button
            type="button"
            className="btn btn-ghost btn-sm menu-toggle"
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <IconMenu open={mobileMenuOpen} />
          </button>

          <nav
            id="primary-navigation"
            aria-label="Navegación principal"
            className="primary-nav"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </NavLink>
            <NavLink
              to="/catalog"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Catálogo
            </NavLink>
            {isAuthenticated ? (
              <NavLink
                to="/app"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Panel Operativo
              </NavLink>
            ) : null}
          </nav>

          <div className="header-actions">
            {isAuthenticated && user ? (
              <>
                <div className="user-chip">
                  <span className="user-avatar" aria-hidden="true">
                    {userInitials}
                  </span>
                  <div>
                    <div className="user-name">{user.full_name}</div>
                    <div className="user-roles">
                      {Array.isArray(user.roles) && user.roles.length
                        ? user.roles.join(', ')
                        : 'operador'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary pill"
                  onClick={handleLogoutClick}
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-sm btn-primary pill"
                onClick={() => setMobileMenuOpen(false)}
              >
                Acceso Operativo
              </Link>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated && isOpsSection ? (
        <div className="ops-layout">
          <aside className="ops-sidebar" aria-label="Módulos del circuito">
            <div className="ops-group">
              <span className="ops-group-title">Circuito de Compra</span>
              <NavLink to="/app" end className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                <IconLayers />
                <span>Consola y Sesión</span>
              </NavLink>
              <NavLink to="/app/requisitions" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                <IconFileText />
                <span>1. Requisiciones</span>
              </NavLink>
              <NavLink to="/app/approvals" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                <IconCheck />
                <span>2. Aprobaciones</span>
              </NavLink>
              {hasRole('buyer', 'warehouse', 'finance') ? (
                <NavLink to="/app/orders" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                  <IconTruck />
                  <span>3. Órdenes</span>
                </NavLink>
              ) : null}
            </div>

            <div className="ops-group">
              <span className="ops-group-title">Almacén y Finanzas</span>
              {hasRole('buyer', 'warehouse', 'finance') ? (
                <NavLink to="/app/receipts" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                  <IconBox />
                  <span>4. Recepciones</span>
                </NavLink>
              ) : null}
              {hasRole('warehouse', 'buyer', 'analyst') ? (
                <NavLink to="/app/inventory" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                  <IconLayers />
                  <span>5. Inventario</span>
                </NavLink>
              ) : null}
              {hasRole('finance') ? (
                <NavLink to="/app/invoices" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                  <IconFileText />
                  <span>6. Facturas</span>
                </NavLink>
              ) : null}
              {hasRole('finance') ? (
                <NavLink to="/app/payments" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                  <IconCreditCard />
                  <span>7. Pagos</span>
                </NavLink>
              ) : null}
            </div>

            <div className="ops-group">
              <span className="ops-group-title">Control y Reglas</span>
              {hasRole('analyst', 'finance', 'buyer', 'warehouse') ? (
                <NavLink to="/app/analytics" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                  <IconBarChart />
                  <span>8. Analítica</span>
                </NavLink>
              ) : null}
              {hasRole('admin') ? (
                <NavLink
                  to="/app/admin/price-imports"
                  className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}
                >
                  <IconUpload />
                  <span>Importar Precios</span>
                </NavLink>
              ) : null}
              {hasRole('admin') ? (
                <NavLink
                  to="/app/admin/masters"
                  className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}
                >
                  <IconSliders />
                  <span>Maestros y Reglas</span>
                </NavLink>
              ) : null}
            </div>
          </aside>

          <main id="main-content" className="ops-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      ) : (
        <main id="main-content" className="public-main" tabIndex={-1}>
          {children}
        </main>
      )}

      <footer className="site-footer">
        <div className="wrap">
          {isOpsSection ? (
            <div className="ops-footer-line">
              <div>
                <strong>Ferretería Clavos</strong> — Consola operativa segura. Token Bearer en memoria React.
              </div>
              <div className="mono">
                Aritmética decimal exacta | Sin cotización automática de EPA
              </div>
            </div>
          ) : (
            <>
              <div className="footer-grid">
                <div>
                  <div className="footer-word">
                    Clavos<span className="dot">.</span>
                  </div>
                  <p className="footer-note" style={{ marginTop: '0.85rem' }}>
                    Plataforma de catálogo de ferretería y circuito integral de compras: desde la consulta transparente de observaciones de precios hasta la conciliación y pago.
                  </p>
                </div>
                <div>
                  <div className="footer-title">Exploración</div>
                  <ul className="footer-links">
                    <li><Link to="/catalog">Catálogo público</Link></li>
                    <li><Link to="/catalog?brand=Truper">Herramientas por marca</Link></li>
                    <li><Link to="/login">Acceso a consola privada</Link></li>
                  </ul>
                </div>
                <div>
                  <div className="footer-title">Circuito Transaccional</div>
                  <ul className="footer-links">
                    <li><Link to="/login">Requisiciones y Aprobaciones</Link></li>
                    <li><Link to="/login">Órdenes de Compra</Link></li>
                    <li><Link to="/login">Recepción en Almacén</Link></li>
                    <li><Link to="/login">Conciliación de Facturas</Link></li>
                  </ul>
                </div>
                <div>
                  <div className="footer-title">Compromiso de Datos</div>
                  <p className="footer-note">
                    Todas las observaciones de precio corresponden a registros históricos validados con proveedor y fecha. Ningún precio observado garantiza la tarifa actual en mostrador.
                  </p>
                </div>
              </div>

              <div className="footer-base">
                <div>© Ferretería Clavos. Todos los derechos reservados.</div>
                <div className="mono">
                  Sesión Bearer en memoria · Sin conexión en vivo con EPA · Precisión monetaria exacta
                </div>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
