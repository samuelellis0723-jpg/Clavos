import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import { formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

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
          `Sesión verificada con GET /api/auth/me a las ${new Date().toISOString().slice(11, 19)} UTC.`
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
      folio: 'PASO 01 / REQUISICIONES',
      title: 'Requisiciones de Compra',
      path: '/app/requisitions',
      allowed: true,
      rolesText: 'requester (propias), buyer, warehouse, admin',
      description:
        'Crear requisiciones en borrador con centro de costo del departamento del solicitante, consultar líneas/aprobaciones y enviar a revisión.',
    },
    {
      folio: 'PASO 02 / APROBACIONES',
      title: 'Bandeja de Aprobaciones y Decisión',
      path: '/app/approvals',
      allowed: true,
      rolesText: 'Roles exigidos por approval_rules (sin autoaprobación)',
      description:
        'Consultar pasos pendientes para tus role_ids actuales y registrar decisión (approved / rejected) con comentarios auditables.',
    },
    {
      folio: 'PASO 03 / ÓRDENES DE COMPRA',
      title: 'Órdenes de Compra y Envío',
      path: '/app/orders',
      allowed: hasRole('buyer', 'warehouse', 'finance'),
      rolesText: 'Lectura: buyer, warehouse, finance, admin | Escritura: buyer, admin',
      description:
        'Generar orden completa en un único proveedor desde una requisición aprobada y marcar el envío operativo (sent).',
    },
    {
      folio: 'PASO 04 / RECEPCIONES',
      title: 'Recepción de Mercancía en Almacén',
      path: '/app/receipts',
      allowed: hasRole('buyer', 'warehouse', 'finance'),
      rolesText: 'Lectura: buyer, warehouse, finance, admin | Escritura: warehouse, admin',
      description:
        'Registrar entregas parciales o totales (quantity_received = accepted + rejected) y generar entradas de stock automáticas.',
    },
    {
      folio: 'PASO 05 / INVENTARIO',
      title: 'Saldos de Inventario y Traslados',
      path: '/app/inventory',
      allowed: hasRole('warehouse', 'buyer', 'analyst'),
      rolesText: 'Saldo: warehouse, buyer, analyst, admin | Traslado: warehouse, admin',
      description:
        'Consultar existencias en mano, reservadas y disponibles por producto/almacén y ejecutar traslados transaccionales.',
    },
    {
      folio: 'PASO 06 / FACTURAS',
      title: 'Facturas Conciliadas y Aprobación',
      path: '/app/invoices',
      allowed: hasRole('finance'),
      rolesText: 'finance, admin',
      description:
        'Registrar facturas de proveedor con conciliación exacta contra órdenes recibidas y aprobarlas para pago.',
    },
    {
      folio: 'PASO 07 / PAGOS',
      title: 'Programación y Confirmación de Pagos',
      path: '/app/payments',
      allowed: hasRole('finance'),
      rolesText: 'finance, admin',
      description:
        'Programar el pago completo de una factura aprobada y confirmar la fecha y referencia bancaria del pago externo.',
    },
    {
      folio: 'PASO 08 / ANALÍTICA',
      title: 'Gasto, Evaluación de Proveedores y Reorden',
      path: '/app/analytics',
      allowed: hasRole('analyst', 'finance', 'buyer', 'warehouse'),
      rolesText: 'analyst, finance, buyer, warehouse, admin (según reporte)',
      description:
        'Consultar gasto por moneda/categoría, promedio ponderado de evaluaciones existentes y cálculo de punto de reorden.',
    },
    {
      folio: 'ADMIN 01 / IMPORTACIÓN DE PRECIOS',
      title: 'Importación Autorizada de Observaciones',
      path: '/app/admin/price-imports',
      allowed: hasRole('admin'),
      rolesText: 'Solo admin',
      description:
        'Importar lotes de hasta 100 observaciones reales validadas (per_purchase_unit) e inspeccionar errores por fila.',
    },
    {
      folio: 'ADMIN 02 / MAESTROS Y REGLAS',
      title: 'Mantenimiento de Datos Maestros Permitidos',
      path: '/app/admin/masters',
      allowed: hasRole('admin'),
      rolesText: 'Solo admin (sujeto a middleware/crud-policy.js)',
      description:
        'Administrar departamentos, centros de costo, monedas, unidades, categorías, productos, proveedores, almacenes y reglas.',
    },
  ];

  return (
    <div>
      <section className="page-masthead" aria-labelledby="dashboard-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PANEL OPERATIVO — SESIÓN EN MEMORIA</span>
          <h1 id="dashboard-heading" className="page-title">
            Bienvenido, {user?.full_name}
          </h1>
          <p className="page-description">
            Esta consola adapta la navegación a los roles devueltos por el servidor, recordando que cada petición privada valida tu sesión, estado activo y permisos reales en MySQL.
          </p>
          <div className="btn-group" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleVerifySession}
              disabled={isCheckingSession}
            >
              {isCheckingSession ? 'Consultando /api/auth/me...' : 'Comprobar sesión actual (/api/auth/me)'}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              Cerrar sesión (/api/auth/logout)
            </button>
          </div>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">IDENTIDAD DEL ACTOR ACTUAL</span>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {rolesList.length > 0 ? (
                rolesList.map((r) => (
                  <StatusBadge key={r} customLabel={`Rol: ${r}`} toneOverride="accent" />
                ))
              ) : (
                <StatusBadge customLabel="Sin roles asignados en user_roles" toneOverride="warning" />
              )}
            </div>
          </div>

          <div className="kv-grid">
            <div className="kv-item">
              <span className="kv-label">ID Usuario (user_id)</span>
              <span className="kv-value mono">#{user?.user_id}</span>
            </div>
            <div className="kv-item">
              <span className="kv-label">Departamento (department_id)</span>
              <span className="kv-value mono">
                {user?.department_id ? `#${user.department_id}` : 'Sin departamento'}
              </span>
            </div>
            <div className="kv-item">
              <span className="kv-label">IDs de Rol (role_ids)</span>
              <span className="kv-value mono">
                {roleIdsList.length ? roleIdsList.join(', ') : '—'}
              </span>
            </div>
            <div className="kv-item">
              <span className="kv-label">Expira (expires_at)</span>
              <span className="kv-value mono" style={{ fontSize: '0.78rem' }}>
                {formatUtcDateTime(expiresAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <ErrorAlert error={error} title="Error al verificar la sesión" onDismiss={() => setError(null)} />

      {verifyMessage ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Sesión activa confirmada</div>
          <div className="alert-body">{verifyMessage}</div>
        </div>
      ) : null}

      {!user?.department_id && hasRole('requester', 'buyer') ? (
        <div className="alert-banner alert-warning" role="note">
          <div className="alert-title">Atención para creación de requisiciones</div>
          <div className="alert-body">
            Tu usuario actual tiene <code>department_id: null</code>. Para crear una requisición (<code>POST /api/operations/requisitions</code>), el usuario debe tener asignado un departamento activo y utilizar un centro de costo perteneciente a ese mismo departamento.
          </div>
        </div>
      ) : null}

      <section className="section-block" aria-labelledby="modules-grid-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">CIRCUITO OPERATIVO Y MÓDULOS CONECTADOS</span>
            <h2 id="modules-grid-heading" style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
              Módulos de Trabajo por Prioridad del Circuito
            </h2>
          </div>
        </div>
        <div className="swiss-grid swiss-grid-2" style={{ border: 'none' }}>
          {modules.map((mod) => (
            <div
              key={mod.path}
              className={`swiss-cell ${mod.allowed ? '' : 'swiss-cell-canvas'}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span className="folio-num">{mod.folio}</span>
                <StatusBadge
                  customLabel={mod.allowed ? 'Habilitado para tu sesión' : 'Requiere otro rol'}
                  toneOverride={mod.allowed ? 'success' : 'neutral'}
                />
              </div>
              <h3 style={{ fontSize: '1.08rem' }}>{mod.title}</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--ink-secondary)' }}>{mod.description}</p>
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: 'auto' }}>
                Permisos backend: {mod.rolesText}
              </div>
              <div className="btn-group" style={{ marginTop: '0.5rem' }}>
                <Link
                  to={mod.path}
                  className={`btn btn-sm ${mod.allowed ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {mod.allowed ? 'Abrir módulo' : 'Inspeccionar módulo'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
