import React from 'react';

export default function PaginationBar({
  page = 1,
  limit = 25,
  total = 0,
  totalLabel = 'registros',
  onPageChange,
  onLimitChange,
  allowedLimits = [10, 25, 50, 100],
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 25);
  const safeTotal = Math.max(0, Number(total) || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));

  return (
    <nav className="pagination-bar" aria-label="Paginación de resultados">
      <div className="mono" style={{ fontSize: '0.8125rem', color: 'var(--ink-secondary)' }}>
        Página <strong>{safePage}</strong> de <strong>{totalPages}</strong> — Total: <strong>{safeTotal}</strong> {totalLabel}
      </div>
      <div className="btn-group">
        {onLimitChange ? (
          <label className="mono" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Filas:</span>
            <select
              className="form-control"
              style={{ width: 'auto', minHeight: '38px', padding: '0.25rem 0.5rem' }}
              value={safeLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {allowedLimits.map((lim) => (
                <option key={lim} value={lim}>
                  {lim}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
