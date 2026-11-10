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

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function EqualIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function ProductComparisonPage() {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 24;

  const [comparisonData, setComparisonData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total_supplier_products: 0 });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (nextLimit) => {
    setSearchParams({ page: '1', limit: String(nextLimit) });
  };

  return (
    <div className="wrap">
      {/* NAVEGACIÓN Y BREADCRUMBS */}
      <div style={{ paddingTop: '1.5rem', marginBottom: '1rem' }}>
        <nav aria-label="Ruta de navegación">
          <ol className="breadcrumbs">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalog">Catálogo</Link></li>
            {product ? (
              <li><Link to={`/catalog/products/${product.product_id}`}>{product.name}</Link></li>
            ) : null}
            <li aria-current="page">Comparación de Observaciones</li>
          </ol>
        </nav>
      </div>

      <ErrorAlert
        error={error}
        title="No fue posible cargar la comparación de observaciones de precios"
        onRetry={loadComparison}
      />

      {loading ? (
        <SkeletonLoader
          rows={3}
          columns={2}
          label={`Consultando observaciones del artículo #${productId}...`}
        />
      ) : !product ? (
        <EmptyState
          folio="HTTP 404 — NO ENCONTRADO"
          title={`No se encontró el artículo activo #${productId}`}
          description="Verifica que el identificador corresponda a un producto con estado activo y categoría activa en el catálogo."
        >
          <Link to="/catalog" className="btn btn-primary pill">
            Volver al catálogo
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* CABECERA DE COMPARACIÓN */}
          <section className="compare-head" aria-labelledby="compare-title">
            <div>
              <span className="eyebrow">
                Observaciones Validadas · SKU {product.sku}
              </span>
              <h1 id="compare-title" className="display display-l" style={{ marginTop: '0.35rem' }}>
                {product.name}
              </h1>
              <p className="lede" style={{ marginTop: '0.65rem' }}>
                Proyección pública de la observación validada más reciente por producto equivalente activo de proveedor. Cada registro conserva su fecha histórica y <strong>no garantiza el precio actual en tienda</strong>.
              </p>
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  to={`/catalog/products/${product.product_id}`}
                  className="btn btn-sm btn-secondary pill"
                >
                  ← Ver ficha técnica del artículo
                </Link>
              </div>
            </div>

            <div className="compare-stats">
              <div className="compare-stat">
                <span className="stat-label">Equivalentes vinculados</span>
                <span className="stat-value">{pagination.total_supplier_products ?? 0}</span>
                <span className="stat-sub">en el maestro de catálogo</span>
              </div>
              <div className="compare-stat">
                <span className="stat-label">Ofertas en página</span>
                <span className="stat-value">{offers.length}</span>
                <span className="stat-sub">observaciones validadas</span>
              </div>
            </div>
          </section>

          {/* REGLAS FUNDAMENTALES DE LA COMPARACIÓN */}
          <div className="rules" role="region" aria-label="Principios de comparación de Ferretería Clavos">
            <div className="rule">
              <div className="rule-icon">
                <ShieldCheck />
              </div>
              <div>
                <strong>Sin ganador comercial</strong>
                <span>El servidor fija ranking="none". No declaramos "mejor precio" engañoso.</span>
              </div>
            </div>

            <div className="rule">
              <div className="rule-icon">
                <EqualIcon />
              </div>
              <div>
                <strong>Agrupación estricta</strong>
                <span>Solo se comparan ofertas con idéntica unidad, empaque, divisa e impuesto.</span>
              </div>
            </div>

            <div className="rule">
              <div className="rule-icon">
                <HistoryIcon />
              </div>
              <div>
                <strong>Observaciones históricas</strong>
                <span>Sin cotización en vivo con EPA. Las fechas reflejan el momento de captura.</span>
              </div>
            </div>
          </div>

          {/* DETALLES TÉCNICOS DEL CONTRATO */}
          <details className="contract-details">
            <summary>
              <span>Parámetros contractuales del endpoint (meta)</span>
              <ChevronDown />
            </summary>
            <dl className="contract-list">
              <div>
                <dt>Base de precio (price_basis):</dt>
                <dd>{meta?.price_basis || 'per_purchase_unit'}</dd>
              </div>
              <div>
                <dt>Algoritmo de ranking:</dt>
                <dd>{meta?.ranking || 'none'} (sin vencedor predefinido)</dd>
              </div>
              <div>
                <dt>Conversión de moneda/unidad:</dt>
                <dd>{meta?.conversion || 'none'} (sin conversión forzada)</dd>
              </div>
              <div>
                <dt>Política de presentación:</dt>
                <dd>{meta?.presentation_policy || 'compare_only_equal_comparison_group'}</dd>
              </div>
              <div>
                <dt>Base de disponibilidad:</dt>
                <dd>{meta?.availability_basis || 'purchase_units_at_observed_at'}</dd>
              </div>
              <div>
                <dt>Garantía de precio actual:</dt>
                <dd>false (is_current_price_guaranteed: false)</dd>
              </div>
            </dl>
          </details>

          {/* GRUPOS DE OFERTAS O ESTADO VACÍO */}
          {offers.length === 0 ? (
            <EmptyState
              folio="SIN OBSERVACIONES ELEGIBLES"
              title="No hay observaciones de precios validadas disponibles para mostrar"
              description={
                pagination.total_supplier_products > 0
                  ? `Existen ${pagination.total_supplier_products} producto(s) equivalente(s) activo(s) vinculados a este artículo, pero ninguno cuenta en esta página con una observación validada (is_validated: true), no futura y con proveedor/moneda activos.`
                  : 'Este producto aún no cuenta con productos equivalentes de proveedor (supplier_products) registrados en la base de datos.'
              }
            >
              <Link to={`/catalog/products/${product.product_id}`} className="btn btn-secondary pill">
                Volver a la ficha técnica
              </Link>
              <Link to="/catalog" className="btn btn-primary pill">
                Explorar otros artículos
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
            allowedLimits={[12, 24, 48]}
          />
        </>
      )}
    </div>
  );
}
