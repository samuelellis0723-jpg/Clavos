import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, indexFolio }) {
  if (!product) return null;

  const unitLabel = product.unit
    ? `${product.unit.name} (${product.unit.code})`
    : `Unidad #${product.unit_id}`;
  const categoryLabel = product.category
    ? `${product.category.name} (${product.category.code})`
    : `Categoría #${product.category_id}`;

  return (
    <article className="swiss-cell" aria-labelledby={`prod-title-${product.product_id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span className="folio-num">
          {indexFolio || `ID #${product.product_id}`} — SKU {product.sku}
        </span>
        <span className={`badge ${product.is_stockable ? 'badge-success' : ''}`}>
          {product.is_stockable ? 'Inventariable' : 'No inventariable'}
        </span>
      </div>

      <h3 id={`prod-title-${product.product_id}`} style={{ fontSize: '1.1rem' }}>
        <Link
          to={`/catalog/products/${product.product_id}`}
          style={{ color: 'var(--ink-primary)', textDecoration: 'none' }}
        >
          {product.name}
        </Link>
      </h3>

      {product.description ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>{product.description}</p>
      ) : (
        <p style={{ fontSize: '0.825rem', color: 'var(--ink-muted)' }}>Sin descripción adicional en catálogo.</p>
      )}

      <div
        className="mono"
        style={{
          fontSize: '0.78rem',
          color: 'var(--ink-secondary)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.35rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--grid-hairline)',
          marginTop: 'auto',
        }}
      >
        <div>
          <strong>Categoría:</strong> {categoryLabel}
        </div>
        <div>
          <strong>Unidad base:</strong> {unitLabel}
        </div>
        <div>
          <strong>Marca:</strong> {product.brand || '—'}
        </div>
        <div>
          <strong>Modelo / Barcode:</strong> {product.model || product.barcode || '—'}
        </div>
      </div>

      <div className="btn-group" style={{ marginTop: '0.5rem' }}>
        <Link to={`/catalog/products/${product.product_id}`} className="btn btn-sm btn-secondary">
          Ficha técnica
        </Link>
        <Link to={`/catalog/products/${product.product_id}/comparison`} className="btn btn-sm btn-primary">
          Comparar observaciones
        </Link>
      </div>
    </article>
  );
}
