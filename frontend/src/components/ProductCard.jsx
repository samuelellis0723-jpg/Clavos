import React from 'react';
import { Link } from 'react-router-dom';
import ProductPlate from './ProductPlate.jsx';

export default function ProductCard({ product, indexFolio }) {
  if (!product) return null;

  const unitLabel = product.unit
    ? `${product.unit.name} (${product.unit.code})`
    : `Unidad #${product.unit_id}`;
  const categoryLabel = product.category
    ? product.category.name
    : `Categoría #${product.category_id}`;

  return (
    <article className="p-card" aria-labelledby={`prod-title-${product.product_id}`}>
      <ProductPlate product={product} />

      <div className="p-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span className="p-cat">{categoryLabel}</span>
          {indexFolio ? (
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)' }}>
              {indexFolio}
            </span>
          ) : null}
        </div>

        <h3 id={`prod-title-${product.product_id}`} className="p-name">
          <Link to={`/catalog/products/${product.product_id}`}>
            {product.name}
          </Link>
        </h3>

        {product.description ? (
          <p className="p-desc">{product.description}</p>
        ) : (
          <p className="p-desc" style={{ color: 'var(--steel-2)' }}>
            Especificación técnica estándar del maestro de catálogo.
          </p>
        )}

        <div className="p-meta">
          <div>
            <span>Unidad:</span> <b>{unitLabel}</b>
          </div>
          {product.brand ? (
            <div>
              <span>Marca:</span> <b>{product.brand}</b>
            </div>
          ) : null}
          {product.model ? (
            <div>
              <span>Modelo:</span> <b className="mono">{product.model}</b>
            </div>
          ) : product.barcode ? (
            <div>
              <span>Barcode:</span> <b className="mono">{product.barcode}</b>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-actions">
        <Link
          to={`/catalog/products/${product.product_id}`}
          className="btn btn-sm btn-secondary pill"
        >
          Ficha técnica
        </Link>
        <Link
          to={`/catalog/products/${product.product_id}/comparison`}
          className="btn btn-sm btn-primary pill"
        >
          Comparar precios
        </Link>
      </div>
    </article>
  );
}
