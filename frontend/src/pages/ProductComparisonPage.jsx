import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  fetchCatalogProductComparison,
  groupOffersByComparisonGroup,
} from '../services/catalogService.js';
import OfferGroupCard from '../components/OfferGroupCard.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PaginationBar from '../components/PaginationBar.jsx';

export default function ProductComparisonPage() {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 25;

  const [comparisonData, setComparisonData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total_supplier_products: 0 });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComparison = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCatalogProductComparison(productId, { page, limit });
      setComparisonData(response?.data || null);
      setPagination(
        response?.pagination || {
          page,
          limit,
          total_supplier_products: 0,
        }
      );
      setMeta(response?.meta || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [productId, page, limit]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  const product = comparisonData?.product || null;
  const offers = comparisonData?.offers || [];

  const { comparableGroups, unconfirmedOffers } = useMemo(
    () => groupOffersByComparisonGroup(offers),
    [offers]
  );

  const handlePageChange = (nextPage) => {
    setSearchParams({ page: String(nextPage), limit: String(limit) });
  };

  const handleLimitChange = (nextLimit) => {
    setSearchParams({ page: '1', limit: String(nextLimit) });
  };

  return (
    <div>
      <div className="btn-group" style={{ marginBottom: '1rem' }}>
        <Link to="/catalog" className="btn btn-sm btn-secondary">
          Catálogo público
        </Link>
        <Link to={`/catalog/products/${productId}`} className="btn btn-sm btn-secondary">
          Ficha del producto #{productId}
        </Link>
      </div>

      <ErrorAlert
        error={error}
        title="No se pudo consultar la comparación de observaciones de precios"
        onRetry={loadComparison}
      />

      {loading ? (
        <SkeletonLoader
          rows={3}
          columns={2}
          label={`Consultando GET /api/catalog/products/${productId}/comparison...`}
        />
      ) : !product ? (
        <EmptyState
          folio="PRODUCTO NO DISPONIBLE (404)"
          title={`No se encontró el producto activo #${productId}`}
          description="Verifica que el identificador corresponda a un producto activo con categoría activa."
        >
          <Link to="/catalog" className="btn btn-primary">
            Volver al catálogo
          </Link>
        </EmptyState>
      ) : (
        <>
          <section className="page-masthead" aria-labelledby="comparison-heading">
            <div className="page-masthead-primary">
              <span className="folio-num">
                COMPARACIÓN DE OBSERVACIONES — PRODUCTO #{product.product_id} ({product.sku})
              </span>
              <h1 id="comparison-heading" className="page-title">
                {product.name}
              </h1>
              <p className="page-description">
                Proyección pública de la observación validada más reciente por producto equivalente activo de proveedor. Cada observación conserva su fecha histórica y <strong>nunca garantiza el precio actual</strong> (<code>is_current_price_guaranteed: false</code>).
              </p>
              <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: '0.35rem' }}>
                Unidad base del producto: <strong>{product.unit?.name} ({product.unit?.code})</strong> | Categoría:{' '}
                <strong>{product.category?.name} ({product.category?.code})</strong>
              </div>
            </div>

            <div className="page-masthead-meta">
              <div>
                <span className="folio-num">CONTRATO META DE COMPARACIÓN</span>
                <div className="mono" style={{ fontSize: '0.76rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                  <div>
                    <strong>price_basis:</strong> {meta?.price_basis || 'per_purchase_unit'}
                  </div>
                  <div>
                    <strong>ranking:</strong> {meta?.ranking || 'none'} (sin ganador automático)
                  </div>
                  <div>
                    <strong>conversion:</strong> {meta?.conversion || 'none'} (sin conversión de moneda/unidad)
                  </div>
                  <div>
                    <strong>presentation_policy:</strong>{' '}
                    {meta?.presentation_policy || 'compare_only_equal_comparison_group'}
                  </div>
                  <div>
                    <strong>availability_basis:</strong>{' '}
                    {meta?.availability_basis || 'purchase_units_at_observed_at'}
                  </div>
                </div>
              </div>
              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Candidatos equivalentes</span>
                  <span className="kv-value mono">{pagination.total_supplier_products ?? 0}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Ofertas en esta página</span>
                  <span className="kv-value mono">{offers.length}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="alert-banner alert-info" role="note">
            <div className="alert-title">Política de comparación e integridad de datos comerciales</div>
            <div className="alert-body">
              Las ofertas solo son comparables dentro de un mismo <code>comparison_group</code> (igual unidad de compra, igual <code>pack_quantity</code>, igual moneda e igual tratamiento de impuesto). No se convierten divisas ni se dividen precios de cajas/empaques automáticamente. Tampoco se realiza scraping ni consulta en vivo a EPA.
            </div>
          </div>

          {offers.length === 0 ? (
            <EmptyState
              folio="OFFERS: [] — SIN OBSERVACIONES ELEGIBLES EN ESTA PÁGINA"
              title="No hay observaciones de precios validadas disponibles para mostrar"
              description={
                pagination.total_supplier_products > 0
                  ? `Existen ${pagination.total_supplier_products} producto(s) equivalente(s) activo(s) vinculados a este artículo, pero ninguno cuenta en esta página con una observación validada (is_validated: true) y no futura con fuente y moneda activas.`
                  : 'Este producto aún no tiene productos equivalentes de proveedor (supplier_products) activos ni observaciones importadas.'
              }
            >
              <Link to={`/catalog/products/${product.product_id}`} className="btn btn-secondary">
                Ver ficha técnica
              </Link>
              <Link to="/catalog" className="btn btn-primary">
                Explorar otros productos
              </Link>
            </EmptyState>
          ) : (
            <>
              {comparableGroups.map((group, idx) => (
                <OfferGroupCard
                  key={group.comparison_group}
                  group={group}
                  groupIndex={idx + 1}
                  isUnconfirmedBucket={false}
                />
              ))}

              {unconfirmedOffers.length > 0 ? (
                <OfferGroupCard
                  group={{ offers: unconfirmedOffers }}
                  groupIndex={comparableGroups.length + 1}
                  isUnconfirmedBucket={true}
                />
              ) : null}
            </>
          )}

          <PaginationBar
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total_supplier_products}
            totalLabel="productos equivalentes activos (total_supplier_products)"
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </div>
  );
}
