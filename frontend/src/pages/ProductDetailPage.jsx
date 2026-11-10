import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCatalogProductDetail } from '../services/catalogService.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import ProductPlate from '../components/ProductPlate.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function ArrowRight() {
  return (
    <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCatalogProductDetail(productId);
      setProduct(response?.data || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const categoryLabel = product?.category
    ? `${product.category.name} (${product.category.code})`
    : `Categoría #${product?.category_id ?? '—'}`;

  const unitLabel = product?.unit
    ? `${product.unit.name} (${product.unit.code})`
    : `Unidad #${product?.unit_id ?? '—'}`;

  return (
    <div className="wrap">
      {/* NAVEGACIÓN SECUNDARIA */}
      <div style={{ paddingTop: '1.5rem', marginBottom: '1.25rem' }}>
        <nav aria-label="Ruta de navegación">
          <ol className="breadcrumbs">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalog">Catálogo Público</Link></li>
            <li aria-current="page">{product ? product.name : `Producto #${productId}`}</li>
          </ol>
        </nav>
      </div>

      <ErrorAlert
        error={error}
        title="No fue posible consultar la ficha técnica del producto"
        onRetry={loadDetail}
      />

      {loading ? (
        <SkeletonLoader
          rows={3}
          columns={2}
          label={`Consultando especificación técnica del producto #${productId}...`}
        />
      ) : !product ? (
        <div className="section-block">
          <div className="section-body" style={{ padding: '2.5rem 1.5rem' }}>
            <span className="eyebrow">RECURSO NO DISPONIBLE (HTTP 404)</span>
            <h1 style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>
              El artículo #{productId} no existe o no se encuentra activo
            </h1>
            <p style={{ marginTop: '0.5rem', color: 'var(--steel)' }}>
              El catálogo público proyecta únicamente productos con estado activo asociados a una categoría activa.
            </p>
            <div className="btn-group" style={{ marginTop: '1.25rem' }}>
              <Link to="/catalog" className="btn btn-primary pill">
                Volver al catálogo público
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="detail-grid">
          {/* COLUMNA VISUAL: LÁMINA EDITORIAL */}
          <aside className="detail-media">
            <ProductPlate product={product} size="lg" />
            <p className="media-caption" style={{ marginTop: '0.85rem' }}>
              Lámina gráfica editorial de catálogo — Sin fotografías simuladas
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <StatusBadge
                customLabel={product.is_stockable ? 'Inventariable en almacén' : 'No inventariable'}
                toneOverride={product.is_stockable ? 'success' : 'neutral'}
              />
              <StatusBadge
                customLabel={
                  product.unit?.allows_decimal
                    ? 'Admite fracciones decimales'
                    : 'Solo cantidades enteras'
                }
                toneOverride="accent"
              />
            </div>
          </aside>

          {/* COLUMNA DESCRIPTIVA & ESPECIFICACIONES */}
          <article className="detail-copy">
            <div>
              <span className="eyebrow">{categoryLabel}</span>
              <h1 className="detail-title" style={{ marginTop: '0.35rem' }}>
                {product.name}
              </h1>
            </div>

            <div className="code-row">
              <div className="code-pill">
                <span>SKU:</span> <b>{product.sku}</b>
              </div>
              {product.barcode ? (
                <div className="code-pill">
                  <span>Código de barras:</span> <b>{product.barcode}</b>
                </div>
              ) : null}
              <div className="code-pill">
                <span>ID Interno:</span> <b>#{product.product_id}</b>
              </div>
            </div>

            <p className="lede" style={{ fontSize: '1.05rem', color: 'var(--ink-2)' }}>
              {product.description ||
                'Este artículo cuenta con especificación técnica estandarizada y registro auditable en el maestro de materiales.'}
            </p>

            {/* BANDA DE COMPARACIÓN DE PRECIOS */}
            <div className="cta-strip">
              <div>
                <strong>¿Deseas consultar ofertas de proveedores?</strong>
                <p>
                  Compara observaciones validadas por proveedor agrupadas estrictamente por unidad y presentación.
                </p>
              </div>
              <Link
                to={`/catalog/products/${product.product_id}/comparison`}
                className="btn btn-primary pill"
              >
                Comparar precios <ArrowRight />
              </Link>
            </div>

            {/* TABLA DE ATRIBUTOS VALIDADOS */}
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
                Atributos Técnicos del Maestro
              </h2>

              <dl className="spec-list">
                <div className="spec-row">
                  <dt>Identificador Interno (product_id)</dt>
                  <dd className="mono">#{product.product_id}</dd>
                </div>
                <div className="spec-row">
                  <dt>SKU Maestro</dt>
                  <dd className="mono">{product.sku}</dd>
                </div>
                <div className="spec-row">
                  <dt>Código de Barras</dt>
                  <dd className="mono">{product.barcode || 'No registrado'}</dd>
                </div>
                <div className="spec-row">
                  <dt>Marca</dt>
                  <dd>{product.brand || 'No especificada'}</dd>
                </div>
                <div className="spec-row">
                  <dt>Modelo</dt>
                  <dd className="mono">{product.model || 'No especificado'}</dd>
                </div>
                <div className="spec-row">
                  <dt>Categoría</dt>
                  <dd>
                    {product.category
                      ? `${product.category.name} (${product.category.code}) [#${product.category.category_id}]`
                      : `#${product.category_id}`}
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>Unidad de Medida Base</dt>
                  <dd>
                    {product.unit
                      ? `${product.unit.name} (${product.unit.code}) [#${product.unit.unit_id}]`
                      : `#${product.unit_id}`}
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>Fracciones Permitidas</dt>
                  <dd className="mono">
                    {product.unit?.allows_decimal ? 'Sí (allows_decimal: true)' : 'No (cantidades enteras)'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* AVISO OPERATIVO */}
            <div className="note-card">
              <InfoIcon />
              <div>
                <strong>Condición para el circuito de compras inicial:</strong>
                <p style={{ marginTop: '0.2rem' }}>
                  Para emitir una orden de compra vinculada a esta referencia, los productos equivalentes de proveedor deben coincidir con la unidad base ({unitLabel}) y tener <code>pack_quantity = 1.000</code>.
                </p>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
