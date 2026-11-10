import React from 'react';

export default function EmptyState({ folio = 'ESTADO VACÍO', title, description, children }) {
  return (
    <div className="empty-state" role="status">
      <span className="folio-num">{folio}</span>
      <h3 style={{ fontSize: '1.15rem' }}>{title}</h3>
      <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>{description}</p>
      {children ? <div className="btn-group" style={{ marginTop: '0.5rem' }}>{children}</div> : null}
    </div>
  );
}
