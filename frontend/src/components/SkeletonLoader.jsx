import React from 'react';

export default function SkeletonLoader({ rows = 3, columns = 3, label = 'Consultando datos del servidor...' }) {
  const rowItems = Array.from({ length: rows }, (_, i) => `row-${i}`);
  const colItems = Array.from({ length: columns }, (_, j) => `col-${j}`);

  return (
    <div className="skeleton-wrap" aria-busy="true" aria-live="polite">
      <div className="skeleton-label mono">
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
              <div className="skeleton-box" style={{ width: '40%', height: '0.8rem' }} />
              <div className="skeleton-box" style={{ width: '85%', height: '1.4rem' }} />
              <div className="skeleton-box" style={{ width: '60%', height: '0.9rem' }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
