import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="section-block">
      <div className="section-body">
        <span className="folio-num">HTTP 404 — RUTA NO ENCONTRADA</span>
        <h1 style={{ fontSize: '1.5rem', marginTop: '0.35rem' }}>
          La dirección <code className="mono">{location.pathname}</code> no corresponde a una vista de Clavos
        </h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--ink-secondary)' }}>
          Verifica la URL o regresa al catálogo público o al panel operativo.
        </p>
        <div className="btn-group" style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn btn-primary">
            Ir al inicio
          </Link>
          <Link to="/catalog" className="btn btn-secondary">
            Ir al catálogo público
          </Link>
        </div>
      </div>
    </div>
  );
}
