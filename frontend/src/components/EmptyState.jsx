import React from 'react';

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <line x1="3.27" y1="6.96" x2="12" y2="12.01" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export default function EmptyState({ folio = 'SIN REGISTROS', title, description, children }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon">
        <EmptyIcon />
      </div>
      <span className="eyebrow">{folio}</span>
      <h3 style={{ fontSize: '1.25rem', marginTop: '0.1rem' }}>{title}</h3>
      <p style={{ color: 'var(--steel)', fontSize: '0.94rem', maxWidth: '58ch' }}>{description}</p>
      {children ? <div className="btn-group" style={{ marginTop: '0.75rem' }}>{children}</div> : null}
    </div>
  );
}
