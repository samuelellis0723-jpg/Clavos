import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="wrap notfound">
      <div className="section-block" style={{ maxWidth: '44rem', margin: '0 auto', textAlign: 'center' }}>
        <div className="section-body" style={{ padding: 'clamp(2.5rem, 6vw, 4.5rem) 1.5rem' }}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            HTTP 404 — PÁGINA NO ENCONTRADA
          </span>

          <div className="big" style={{ margin: '1rem 0' }}>
            404<span>.</span>
          </div>

          <h1 style={{ fontSize: '1.4rem' }}>
            La dirección <code className="mono">{location.pathname}</code> no existe en el taller
          </h1>

          <p style={{ marginTop: '0.65rem', color: 'var(--steel)', marginInline: 'auto' }}>
            El recurso solicitado no corresponde a una ruta pública ni a un módulo operativo activo de Clavos.
          </p>

          <div className="btn-group" style={{ justifyContent: 'center', marginTop: '1.75rem' }}>
            <Link to="/" className="btn btn-primary pill">
              Volver al inicio
            </Link>
            <Link to="/catalog" className="btn btn-secondary pill">
              Explorar catálogo público
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
