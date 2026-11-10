import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';

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

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <header className="top-header">
        <div className="top-header-inner">
          <Link to="/" className="brand-cell" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              CL
            </span>
            <div>
              <span className="brand-title">Ferretería Clavos</span>
              <span className="brand-subtitle">CATÁLOGO Y ABASTECIMIENTO</span>
            </div>
          </Link>

          <button
            type="button"
            className="btn btn-sm btn-secondary mobile-menu-toggle"
            style={{ margin: '0.5rem 1rem' }}
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? 'Cerrar menú' : 'Menú'}
          </button>

          <nav
            id="primary-navigation"
            aria-label="Navegación principal"
            className={`primary-nav ${mobileMenuOpen ? 'open' : ''}`}
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mono">01</span> Inicio
            </NavLink>
            <NavLink
              to="/catalog"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mono">02</span> Catálogo Público
            </NavLink>
            {isAuthenticated ? (
              <NavLink
                to="/app"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mono">03</span> Operaciones Privadas
              </NavLink>
            ) : null}
          </nav>

          <div className="header-session-cell">
            {isAuthenticated && user ? (
              <>
                <div style={{ fontSize: '0.8125rem', lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 700 }}>{user.full_name}</div>
                  <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--ink-secondary)' }}>
                    Roles: {Array.isArray(user.roles) && user.roles.length ? user.roles.join(', ') : 'sin rol'}
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleLogoutClick}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-sm btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Acceso Operativo
              </Link>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated && isOpsSection ? (
        <nav className="ops-subnav" aria-label="Módulos del circuito privado">
          <div className="ops-subnav-inner">
            <NavLink to="/app" end className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
              Panel y Sesión
            </NavLink>
            <NavLink to="/app/requisitions" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
              1. Requisiciones
            </NavLink>
            <NavLink to="/app/approvals" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
              2. Aprobaciones
            </NavLink>
            {hasRole('buyer', 'warehouse', 'finance') ? (
              <NavLink to="/app/orders" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                3. Órdenes
              </NavLink>
            ) : null}
            {hasRole('buyer', 'warehouse', 'finance') ? (
              <NavLink to="/app/receipts" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                4. Recepciones
              </NavLink>
            ) : null}
            {hasRole('warehouse', 'buyer', 'analyst') ? (
              <NavLink to="/app/inventory" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                5. Inventario y Traslados
              </NavLink>
            ) : null}
            {hasRole('finance') ? (
              <NavLink to="/app/invoices" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                6. Facturas
              </NavLink>
            ) : null}
            {hasRole('finance') ? (
              <NavLink to="/app/payments" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                7. Pagos
              </NavLink>
            ) : null}
            {hasRole('analyst', 'finance', 'buyer', 'warehouse') ? (
              <NavLink to="/app/analytics" className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}>
                8. Gasto, Evaluación y Reorden
              </NavLink>
            ) : null}
            {hasRole('admin') ? (
              <NavLink
                to="/app/admin/price-imports"
                className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}
              >
                Importación Precios
              </NavLink>
            ) : null}
            {hasRole('admin') ? (
              <NavLink
                to="/app/admin/masters"
                className={({ isActive }) => `ops-nav-link ${isActive ? 'active' : ''}`}
              >
                Maestros y Reglas
              </NavLink>
            ) : null}
          </div>
        </nav>
      ) : null}

      <main id="main-content" className="main-container" tabIndex={-1}>
        {children}
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div>
            <strong>Ferretería Clavos</strong> — Catálogo público, comparación de observaciones históricas y circuito privado auditable.
          </div>
          <div className="mono">
            Sesión Bearer en memoria | Sin actualización automática de EPA | Aritmética decimal exacta
          </div>
        </div>
      </footer>
    </div>
  );
}
