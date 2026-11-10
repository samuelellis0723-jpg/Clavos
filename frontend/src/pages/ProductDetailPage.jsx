import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCatalogProductDetail } from '../services/catalogService.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

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

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/catalog" className="btn btn-sm btn-secondary">
          Volver al catálogo público
        </Link>
      </div>

      <ErrorAlert error={error} title="No se pudo cargar la ficha técnica del producto" onRetry={loadDetail} />

      {loading ? (
        <SkeletonLoader rows={2} columns={2} label={`Consultando GET /api/catalog/products/${productId}...`} />
      ) : !product ? (
        <div className="section-block">
          <div className="section-body">
            <span className="folio-num">RECURSO NO DISPONIBLE (404)</span>
            <h1 style={{ fontSize: '1.4rem', marginTop: '0.35rem' }}>
              El producto #{productId} no existe o no se encuentra activo
            </h1>
            <p style={{ marginTop: '0.5rem', color: 'var(--ink-secondary)' }}>
              El catálogo público únicamente proyecta productos con estado activo pertenecientes a una categoría activa.
            </p>
            <div className="btn-group" style={{ marginTop: '1rem' }}>
              <Link to="/catalog" className="btn btn-primary">
                Explorar productos activos
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="page-masthead" aria-labelledby="product-detail-heading">
            <div className="page-masthead-primary">
              <span className="folio-num">
                FICHA TÉCNICA — PRODUCTO #{product.product_id} | SKU: {product.sku}
              </span>
              <h1 id="product-detail-heading" className="page-title">
                {product.name}
              </h1>
              <p className="page-description">
                {product.description || 'Este producto no registra descripción extendida en el maestro de productos.'}
              </p>
              <div className="btn-group" style={{ marginTop: '0.75rem' }}>
                <Link
                  to={`/catalog/products/${product.product_id}/comparison`}
                  className="btn btn-primary"
                >
                  Ver comparación de observaciones de precios por proveedor
                </Link>
              </div>
            </div>

            <div className="page-masthead-meta">
              <div>
                <span className="folio-num">CLASIFICACIÓN Y UNIDAD BASE</span>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <StatusBadge
                    customLabel={product.is_stockable ? 'Inventariable (is_stockable: true)' : 'No inventariable'}
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
              </div>
              <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                Para órdenes del circuito inicial, los productos equivalentes de proveedor deben coincidir con la unidad base ({product.unit?.code || `#${product.unit_id}`}) y tener <code>pack_quantity = 1.000</code>.
              </div>
            </div>
          </section>

          <section className="section-block" aria-labelledby="specs-heading">
            <div className="section-header">
              <div>
                <span className="folio-num">ESPECIFICACIONES DEL MAESTRO</span>
                <h2 id="specs-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                  Atributos Validados del Producto
                </h2>
              </div>
            </div>
            <div className="kv-grid" style={{ border: 'none' }}>
              <div className="kv-item">
                <span className="kv-label">ID Interno (product_id)</span>
                <span className="kv-value mono">#{product.product_id}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">SKU</span>
                <span className="kv-value mono">{product.sku}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Código de barras (barcode)</span>
                <span className="kv-value mono">{product.barcode || 'No registrado'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Marca (brand)</span>
                <span className="kv-value">{product.brand || 'No especificada'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Modelo (model)</span>
                <span className="kv-value">{product.model || 'No especificado'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Categoría (category)</span>
                <span className="kv-value">
                  {product.category
                    ? `${product.category.name} (${product.category.code}) [#${product.category.category_id}]`
                    : `#${product.category_id}`}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Unidad de medida base (unit)</span>
                <span className="kv-value">
                  {product.unit
                    ? `${product.unit.name} (${product.unit.code}) [#${product.unit.unit_id}]`
                    : `#${product.unit_id}`}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Fracciones (allows_decimal)</span>
                <span className="kv-value mono">{String(Boolean(product.unit?.allows_decimal))}</span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
