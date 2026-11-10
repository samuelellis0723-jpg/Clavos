import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import { formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function IconFileText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
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

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
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

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="20" y1="21" x2="20" y2="16" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, expiresAt, refreshMe, logout, isCheckingSession, hasRole } = useAuth();
  const navigate = useNavigate();
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleVerifySession = async () => {
    setError(null);
    setVerifyMessage(null);
    try {
      const updatedUser = await refreshMe();
      if (updatedUser) {
        setVerifyMessage(
          `Sesión verificada contra GET /api/auth/me a las ${new Date().toISOString().slice(11, 19)} UTC.`
        );
      }
    } catch (err) {
      setError(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const rolesList = Array.isArray(user?.roles) ? user.roles : [];
  const roleIdsList = Array.isArray(user?.role_ids) ? user.role_ids : [];

  const modules = [
    {
      step: 'PASO 01',
      title: 'Requisiciones de Compra',
      path: '/app/requisitions',
      icon: IconFileText,
      allowed: true,
      rolesText: 'requester (propias), buyer, warehouse, admin',
      description:
        'Crea requisiciones en borrador asociadas al centro de costo de tu departamento y envíalas a revisión auditable.',
    },
    {
      step: 'PASO 02',
      title: 'Bandeja de Aprobaciones',
      path: '/app/approvals',
      icon: IconCheck,
      allowed: true,
      rolesText: 'Roles exigidos por approval_rules (sin autoaprobación)',
      description:
        'Inspecciona pasos pendientes para tus roles activos y registra decisiones de aprobación o rechazo con comentarios.',
    },
    {
      step: 'PASO 03',
      title: 'Órdenes de Compra',
      path: '/app/orders',
      icon: IconTruck,
      allowed: hasRole('buyer', 'warehouse', 'finance'),
      rolesText: 'Lectura: buyer, warehouse, finance | Escritura: buyer, admin',
      description:
        'Genera órdenes de compra completas en un único proveedor a partir de requisiciones aprobadas y marca su envío.',
    },
    {
      step: 'PASO 04',
      title: 'Recepción en Almacén',
      path: '/app/receipts',
      icon: IconBox,
      allowed: hasRole('buyer', 'warehouse', 'finance'),
      rolesText: 'Lectura: buyer, warehouse, finance | Escritura: warehouse, admin',
      description:
        'Registra recepciones parciales o totales discriminando cantidades aceptadas y rechazadas para alimentar inventario.',
    },
    {
      step: 'PASO 05',
      title: 'Inventario y Traslados',
      path: '/app/inventory',
      icon: IconLayers,
      allowed: hasRole('warehouse', 'buyer', 'analyst'),
      rolesText: 'Saldos: warehouse, buyer, analyst | Traslado: warehouse, admin',
      description:
        'Consulta existencias físicas, reservadas y disponibles por almacén y ejecuta traslados entre bodegas.',
    },
    {
      step: 'PASO 06',
      title: 'Facturas de Proveedor',
      path: '/app/invoices',
      icon: IconFileText,
      allowed: hasRole('finance'),
      rolesText: 'finance, admin',
      description:
        'Registra facturas recibidas de proveedores con conciliación exacta contra recepciones y apruébalas para pago.',
    },
    {
      step: 'PASO 07',
      title: 'Programación de Pagos',
      path: '/app/payments',
      icon: IconCreditCard,
      allowed: hasRole('finance'),
      rolesText: 'finance, admin',
      description:
        'Programa desembolsos sobre facturas aprobadas y confirma la referencia bancaria del pago externo realizado.',
    },
    {
      step: 'PASO 08',
      title: 'Gasto y Reorden',
      path: '/app/analytics',
      icon: IconBarChart,
      allowed: hasRole('analyst', 'finance', 'buyer', 'warehouse'),
      rolesText: 'analyst, finance, buyer, warehouse, admin',
      description:
        'Reportes de gasto por divisa y categoría, evaluaciones de proveedores y cálculo de punto de reorden de existencias.',
    },
    {
      step: 'ADMIN 01',
      title: 'Importación de Precios',
      path: '/app/admin/price-imports',
      icon: IconUpload,
      allowed: hasRole('admin'),
      rolesText: 'Solo rol admin',
      description:
        'Importa lotes de hasta 100 observaciones reales validadas e inspecciona fallos por fila sin corromper la base.',
    },
    {
      step: 'ADMIN 02',
      title: 'Maestros y Reglas',
      path: '/app/admin/masters',
      icon: IconSliders,
      allowed: hasRole('admin'),
      rolesText: 'Solo rol admin (sujeto a crud-policy)',
      description:
        'Mantenimiento de departamentos, centros de costo, monedas, unidades, categorías, proveedores y almacenes.',
    },
  ];

  return (
    <div>
      {/* TARJETA DE BIENVENIDA Y ACTOR */}
      <section className="welcome" aria-labelledby="dash-welcome-heading">
        <div className="welcome-card">
          <span className="eyebrow on-dark" style={{ color: 'var(--signal-on-dark)' }}>
            Consola Operativa Clavos
          </span>
          <h1 id="dash-welcome-heading">
            Hola, {user?.full_name}
          </h1>
          <p>
            Tu sesión Bearer se encuentra activa en memoria. Cada acción que ejecutas verifica tus roles y permisos en MySQL.
          </p>

          <div className="btn-group" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={handleVerifySession}
              disabled={isCheckingSession}
            >
              {isCheckingSession ? 'Comprobando sesión...' : 'Verificar estado con /api/auth/me'}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* METADATOS DEL OPERADOR */}
        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">ROLES ACTIVOS DEL ACTOR</span>
            <div style={{ marginTop: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {rolesList.length > 0 ? (
                rolesList.map((r) => (
                  <StatusBadge key={r} customLabel={`Rol: ${r}`} toneOverride="accent" />
                ))
              ) : (
                <StatusBadge customLabel="Sin roles específicos" toneOverride="warning" />
              )}
            </div>
          </div>

          <div className="kv-grid">
            <div className="kv-item">
              <span className="kv-label">ID Usuario</span>
              <span className="kv-value mono">#{user?.user_id}</span>
            </div>
            <div className="kv-item">
              <span className="kv-label">Departamento</span>
              <span className="kv-value mono">
                {user?.department_id ? `#${user.department_id}` : 'Sin asignar'}
              </span>
            </div>
            <div className="kv-item">
              <span className="kv-label">Role IDs</span>
              <span className="kv-value mono">
                {roleIdsList.length ? roleIdsList.join(', ') : '—'}
              </span>
            </div>
            <div className="kv-item">
              <span className="kv-label">Expira sesión</span>
              <span className="kv-value mono" style={{ fontSize: '0.78rem' }}>
                {formatUtcDateTime(expiresAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ErrorAlert error={error} title="Fallo al verificar sesión" onDismiss={() => setError(null)} />

      {verifyMessage ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Sesión activa verificada</div>
          <div className="alert-body">{verifyMessage}</div>
        </div>
      ) : null}

      {!user?.department_id && hasRole('requester', 'buyer') ? (
        <div className="alert-banner alert-warning" role="note">
          <div className="alert-title">Atención para requisiciones</div>
          <div className="alert-body">
            Tu usuario tiene <code>department_id: null</code>. Para crear requisiciones (<code>POST /api/operations/requisitions</code>) el backend exige que tengas un departamento activo y uses un centro de costo de ese departamento.
          </div>
        </div>
      ) : null}

      {/* MÓDULOS DE TRABAJO */}
      <section className="section-block" aria-labelledby="modules-title">
        <div className="section-header">
          <div>
            <span className="folio-num">CIRCUITO DE ABASTECIMIENTO INTEGRAL</span>
            <h2 id="modules-title" style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
              Módulos Operativos por Fase del Circuito
            </h2>
          </div>
        </div>

        <div className="module-grid">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.path}
                className={`module-card ${mod.allowed ? '' : 'is-locked'}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="module-icon">
                    <Icon />
                  </div>
                  <span className="module-step">{mod.step}</span>
                </div>

                <h3 style={{ marginTop: '0.25rem' }}>{mod.title}</h3>
                <p>{mod.description}</p>

                <div className="module-perms mono">
                  {mod.rolesText}
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <Link
                    to={mod.path}
                    className={`btn btn-sm ${mod.allowed ? 'btn-primary' : 'btn-secondary'} pill`}
                    style={{ width: '100%' }}
                  >
                    {mod.allowed ? 'Acceder al módulo' : 'Inspeccionar vista'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
