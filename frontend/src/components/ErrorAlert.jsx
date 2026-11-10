import React from 'react';

export default function ErrorAlert({ error, title, onRetry, onDismiss }) {
  if (!error) return null;

  const isString = typeof error === 'string';
  const message = isString ? error : error.message || 'Ocurrió un error al procesar la solicitud.';
  const status = !isString && error.status ? error.status : null;
  const code = !isString && error.code ? error.code : null;
  const details = !isString && error.details ? error.details : null;

  return (
    <div className="alert-banner alert-danger" role="alert" aria-live="assertive">
      <div className="alert-title">
        <span>{title || 'Error de operación'}</span>
        {status ? <span className="badge badge-danger">HTTP {status}</span> : null}
        {code ? <span className="badge badge-danger">{code}</span> : null}
      </div>
      <div className="alert-body">{message}</div>
      {details ? (
        <pre
          className="mono"
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#FFFFFF',
            border: '1px solid var(--status-danger-border)',
            fontSize: '0.75rem',
            overflowX: 'auto',
          }}
        >
          {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
        </pre>
      ) : null}
      {onRetry || onDismiss ? (
        <div className="btn-group" style={{ marginTop: '0.5rem' }}>
          {onRetry ? (
            <button type="button" className="btn btn-sm btn-secondary" onClick={onRetry}>
              Reintentar consulta
            </button>
          ) : null}
          {onDismiss ? (
            <button type="button" className="btn btn-sm btn-secondary" onClick={onDismiss}>
              Cerrar aviso
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
