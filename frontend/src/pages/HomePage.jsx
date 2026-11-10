import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCatalogCategories, fetchCatalogProducts } from '../services/catalogService.js';
import ProductCard from '../components/ProductCard.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../features/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetchCatalogCategories({ page: 1, limit: 25 }),
        fetchCatalogProducts({ page: 1, limit: 6 }),
      ]);
      setCategories(catRes?.data || []);
      setTotalCategories(catRes?.pagination?.total ?? 0);
      setProducts(prodRes?.data || []);
      setTotalProducts(prodRes?.pagination?.total ?? 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <div>
      <section className="page-masthead" aria-labelledby="home-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">FOLIO 01 — PLATAFORMA DE CATÁLOGO Y COMPRAS</span>
          <h1 id="home-heading" className="page-title">
            Ferretería Clavos — Catálogo Técnico, Observaciones de Precios y Abastecimiento Auditable
          </h1>
          <p className="page-description">
            Consulta pública de productos activos y comparación transparente de observaciones históricas de precios por proveedor, junto con el circuito privado de requisición, aprobación, orden de compra, recepción en almacén, conciliación de factura y registro de pago.
          </p>
          <div className="btn-group" style={{ marginTop: '0.75rem' }}>
            <Link to="/catalog" className="btn btn-primary">
              Explorar catálogo público
            </Link>
            {isAuthenticated ? (
              <Link to="/app" className="btn btn-secondary">
                Ir al panel operativo ({user?.full_name})
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary">
                Iniciar sesión operativa
              </Link>
            )}
          </div>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">REGLAS DE TRANSPARENCIA Y PRECIOS</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-primary)', fontWeight: 600 }}>
              Sin cotización automática ni promesa de vigencia en tienda
            </p>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              Las ofertas provienen de observaciones históricas validadas e importadas por administración. No existe integración automática con EPA ni garantía de precio actual (<code>is_current_price_guaranteed: false</code>).
            </p>
          </div>
          <div className="kv-grid">
            <div className="kv-item">
              <span className="kv-label">Productos activos</span>
              <span className="kv-value mono">{loading ? '...' : totalProducts}</span>
            </div>
            <div className="kv-item">
              <span className="kv-label">Categorías activas</span>
              <span className="kv-value mono">{loading ? '...' : totalCategories}</span>
            </div>
          </div>
        </div>
      </section>

      <ErrorAlert error={error} title="No se pudo consultar el catálogo inicial" onRetry={loadOverview} />

      <section className="section-block" aria-labelledby="circuit-overview-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">ARQUITECTURA FUNCIONAL</span>
            <h2 id="circuit-overview-heading" style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
              Separación entre consulta pública y operación privada por roles
            </h2>
          </div>
        </div>
        <div className="swiss-grid swiss-grid-3" style={{ border: 'none' }}>
          <div className="swiss-cell">
            <span className="folio-num">01 / PÚBLICO</span>
            <h3 style={{ fontSize: '1rem' }}>Catálogo y Comparación por Grupo</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
              Filtra productos por nombre, SKU, código de barras, categoría, unidad o marca. Compara observaciones agrupadas estrictamente por <code>comparison_group</code> (unidad de compra, empaque, moneda e impuesto).
            </p>
          </div>
          <div className="swiss-cell">
            <span className="folio-num">02 / CIRCUITO DE ABASTECIMIENTO</span>
            <h3 style={{ fontSize: '1rem' }}>Requisición → Aprobación → Orden → Recepción</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
              Control presupuestario estricto por centro de costo y reglas de aprobación por paso y rol efectivo (sin autoaprobación ni sustitución por rol técnico <code>admin</code>).
            </p>
          </div>
          <div className="swiss-cell">
            <span className="folio-num">03 / FINANZAS, INVENTARIO Y ANALÍTICA</span>
            <h3 style={{ fontSize: '1rem' }}>Factura Conciliada, Pago y Punto de Reorden</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
              Conciliación exacta con recepciones registradas, programación y confirmación de referencias de pago externo, traslados entre almacenes y análisis de gasto y reorden.
            </p>
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="categories-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">CLASIFICACIÓN ACTIVA</span>
            <h2 id="categories-heading" style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
              Categorías del Catálogo
            </h2>
          </div>
          <Link to="/catalog" className="btn btn-sm btn-secondary">
            Ver todos los filtros
          </Link>
        </div>
        <div className="section-body">
          {loading ? (
            <SkeletonLoader rows={1} columns={4} label="Consultando GET /api/catalog/categories..." />
          ) : categories.length === 0 ? (
            <EmptyState
              folio="CATÁLOGO SIN CATEGORÍAS ACTIVAS"
              title="No hay categorías activas registradas en este momento"
              description="Cuando un administrador registre categorías activas en la base de datos MySQL local, aparecerán aquí para filtrar el catálogo."
            />
          ) : (
            <div className="swiss-grid swiss-grid-4">
              {categories.map((cat) => (
                <div key={cat.category_id} className="swiss-cell">
                  <span className="folio-num">CÓDIGO: {cat.code}</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cat.name}</div>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                    ID #{cat.category_id}{' '}
                    {cat.parent_category_id ? `| Padre #${cat.parent_category_id}` : '| Categoría raíz'}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <Link
                      to={`/catalog?category_id=${cat.category_id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      Filtrar productos
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-block" aria-labelledby="featured-products-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">VISTA RÁPIDA DEL CATÁLOGO</span>
            <h2 id="featured-products-heading" style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
              Productos Activos Recientes
            </h2>
          </div>
          <Link to="/catalog" className="btn btn-sm btn-primary">
            Abrir catálogo completo
          </Link>
        </div>
        <div className="section-body">
          {loading ? (
            <SkeletonLoader rows={2} columns={3} label="Consultando GET /api/catalog/products..." />
          ) : products.length === 0 ? (
            <EmptyState
              folio="CATÁLOGO PÚBLICO VACÍO"
              title="No se encontraron productos activos en la base de datos"
              description="El catálogo responde correctamente con data: []. Un usuario con rol admin puede registrar unidades, categorías y productos desde el módulo de Maestros y Reglas."
            >
              <Link to="/catalog" className="btn btn-secondary">
                Ir al buscador del catálogo
              </Link>
            </EmptyState>
          ) : (
            <div className="swiss-grid swiss-grid-3">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  indexFolio={`ITEM ${String(idx + 1).padStart(2, '0')}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
