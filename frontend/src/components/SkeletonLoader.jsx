import React from 'react';

export default function SkeletonLoader({ rows = 4, columns = 3, label = 'Cargando datos del servidor...' }) {
  const rowItems = Array.from({ length: rows }, (_, i) => `row-${i}`);
  const colItems = Array.from({ length: columns }, (_, j) => `col-${j}`);

  return (
    <div aria-busy="true" aria-live="polite" style={{ marginBottom: '1rem' }}>
      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div
        className="skeleton-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {rowItems.map((rKey) =>
          colItems.map((cKey) => (
            <div key={`${rKey}-${cKey}`} className="swiss-cell">
              <div className="skeleton-box" style={{ width: '45%', height: '0.75rem' }} />
              <div className="skeleton-box" style={{ width: '85%', height: '1.25rem' }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
