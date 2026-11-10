import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCatalogCategories, fetchCatalogProducts } from '../services/catalogService.js';
import ProductCard from '../components/ProductCard.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { pickGlyph } from '../components/ProductPlate.jsx';
import { useAuth } from '../features/AuthContext.jsx';

import heroFlatlayUrl from '../assets/editorial/taller-composicion.webp';
import materialsMacroUrl from '../assets/editorial/clavos-tornillos.webp';
import pegboardWallUrl from '../assets/editorial/pared-herramientas.webp';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetchCatalogCategories({ page: 1, limit: 12 }),
        fetchCatalogProducts({ page: 1, limit: 6 }),
      ]);
      setCategories(catRes?.data || []);
      setTotalCategories(catRes?.pagination?.total ?? (catRes?.data?.length || 0));
      setProducts(prodRes?.data || []);
      setTotalProducts(prodRes?.pagination?.total ?? (prodRes?.data?.length || 0));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/catalog?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <div>
      {/* HÉROE EDITORIAL */}
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-grid">
          <div className="hero-copy rise rise-1">
            <span className="eyebrow">
              Catálogo Técnico &amp; Abastecimiento
            </span>

            <h1 id="hero-title" className="display display-xl hero-title">
              Herramientas y materiales con <span className="accent">trazabilidad</span> honesta.
            </h1>

            <p className="lede">
              Explora productos activos, compara observaciones históricas de precios por proveedor sin cotizaciones ficticias y gestiona el circuito de compras de tu empresa con precisión decimal.
            </p>

            <form className="hero-search" onSubmit={handleSearchSubmit} role="search">
              <SearchIcon />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por clavo, martillo, SKU o código..."
                aria-label="Buscar productos en el catálogo"
              />
              <button type="submit" className="btn btn-primary pill">
                Buscar <ArrowRight />
              </button>
            </form>

            <div className="btn-group">
              <Link to="/catalog" className="btn btn-dark pill">
                Ver catálogo completo
              </Link>
              {isAuthenticated ? (
                <Link to="/app" className="btn btn-secondary pill">
                  Ir al panel ({user?.full_name?.split(' ')[0] || 'Operador'})
                </Link>
              ) : (
                <Link to="/login" className="btn btn-ghost pill">
                  Acceso para compras y almacén →
                </Link>
              )}
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">{loading ? '—' : totalProducts}</span>
                <span className="stat-label">Artículos activos</span>
              </div>
              <div className="stat">
                <span className="stat-value">{loading ? '—' : totalCategories}</span>
                <span className="stat-label">Categorías registradas</span>
              </div>
              <div className="stat">
                <span className="stat-value">100%</span>
                <span className="stat-label">Observaciones auditables</span>
              </div>
            </div>
          </div>

          <div className="hero-media rise rise-2">
            <figure className="frame">
              <img
                src={heroFlatlayUrl}
                alt="Composición fotográfica de herramientas manuales, clavos galvanizados, regla de carpintero y bloque de madera sobre superficie de grafito"
                loading="eager"
                width="1200"
                height="896"
              />
            </figure>
            <figcaption className="media-caption">
              Composición editorial Clavos — Fotografía de marca representativa de taller
            </figcaption>

            <div className="hero-tag">
              <div className="hero-tag-icon">
                <CheckShield />
              </div>
              <div>
                <strong>Observaciones Validadas</strong>
                <span>Procedencia histórica sin promesa de precio actual en mostrador.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <ErrorAlert
          error={error}
          title="No se pudo cargar la vista preliminar del catálogo"
          onRetry={loadOverview}
        />
      </div>

      {/* RAÍL DE CATEGORÍAS */}
      <section className="section wrap" aria-labelledby="cat-heading">
        <div className="section-head">
          <div>
            <span className="eyebrow">Clasificación del Taller</span>
            <h2 id="cat-heading" className="h-section">
              Explora por Categoría
            </h2>
          </div>
          <Link to="/catalog" className="text-link">
            Ver todas las categorías <ArrowRight />
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader rows={1} columns={4} label="Consultando categorías activas..." />
        ) : categories.length === 0 ? (
          <EmptyState
            folio="SIN CATEGORÍAS"
            title="No hay categorías activas en la base de datos"
            description="Cuando un administrador registre categorías activas en el módulo de maestros, aparecerán aquí clasificadas."
          />
        ) : (
          <div className="category-rail">
            {categories.map((cat) => {
              const Glyph = pickGlyph(cat.name, cat.code);
              return (
                <Link
                  key={cat.category_id}
                  to={`/catalog?category_id=${cat.category_id}`}
                  className="cat-tile"
                >
                  <div className="glyph">
                    <Glyph />
                  </div>
                  <div className="go" aria-hidden="true">
                    <ArrowRight />
                  </div>
                  <div>
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-code">CÓD. {cat.code}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* BANDA EDITORIAL OSCURA: TRANSPARENCIA Y RIGOR */}
      <section className="band-dark section on-dark" aria-labelledby="principles-heading">
        <div className="wrap">
          <div className="band-grid">
            <figure className="band-media">
              <img
                src={materialsMacroUrl}
                alt="Detalle macro de clavos de acero y tornillos galvanizados sobre concreto con cinta de señalización"
                loading="lazy"
                width="1376"
                height="768"
              />
              <figcaption className="media-caption">
                Materiales de fijación — Documentación y trazabilidad de empaque
              </figcaption>
            </figure>

            <div>
              <span className="eyebrow">Integridad Comercial</span>
              <h2 id="principles-heading" className="h-section" style={{ marginTop: '0.4rem' }}>
                Comparar bien exige decir la verdad.
              </h2>
              <p className="lede" style={{ marginTop: '0.75rem' }}>
                En ferretería, un precio sin unidad de compra, empaque o fecha no sirve para tomar decisiones de abastecimiento. Por eso Clavos opera con tres compromisos estrictos:
              </p>

              <ol className="principles">
                <li>
                  <strong>Observaciones históricas, no promesas</strong>
                  <span>
                    Cada oferta refleja una observación validada en una fecha específica. No realizamos consultas en vivo ni garantizamos la tarifa actual en tienda.
                  </span>
                </li>
                <li>
                  <strong>Comparación solo entre iguales</strong>
                  <span>
                    Agrupamos estrictamente por <code>comparison_group</code>: misma unidad, misma cantidad por empaque, misma divisa y mismo régimen fiscal. Sin conversiones engañosas.
                  </span>
                </li>
                <li>
                  <strong>Aritmética decimal exacta</strong>
                  <span>
                    Usamos precisión decimal con <code>BigInt</code> escalado para previsualizaciones de impuestos y subtotales, eliminando errores de punto flotante.
                  </span>
                </li>
              </ol>

              <div style={{ marginTop: '2rem' }}>
                <Link to="/catalog" className="btn btn-outline-light pill">
                  Explorar catálogo de comparación <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="section wrap" aria-labelledby="featured-heading">
        <div className="section-head">
          <div>
            <span className="eyebrow">Catálogo en Vivo</span>
            <h2 id="featured-heading" className="h-section">
              Artículos Activos Recientes
            </h2>
          </div>
          <Link to="/catalog" className="btn btn-secondary pill">
            Abrir catálogo completo ({totalProducts})
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader rows={2} columns={3} label="Cargando productos del catálogo..." />
        ) : products.length === 0 ? (
          <EmptyState
            folio="CATÁLOGO VACÍO"
            title="No se encontraron productos activos en el servidor"
            description="El endpoint público devolvió data: []. Los productos dados de alta por administración aparecerán aquí."
          >
            <Link to="/catalog" className="btn btn-secondary pill">
              Ir al buscador
            </Link>
          </EmptyState>
        ) : (
          <div className="product-grid">
            {products.map((product, idx) => (
              <ProductCard
                key={product.product_id}
                product={product}
                indexFolio={`REF ${String(idx + 1).padStart(2, '0')}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA PARA EQUIPO DE COMPRAS Y OPERACIONES */}
      <section className="section-tight wrap" aria-labelledby="ops-cta-heading">
        <div className="cta-panel">
          <img
            src={pegboardWallUrl}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
          <div className="cta-content">
            <span className="eyebrow on-dark" style={{ color: 'var(--signal-on-dark)' }}>
              Circuito Transaccional Auditable
            </span>
            <h2 id="ops-cta-heading" className="display display-l">
              Del catálogo a la orden de compra en un solo flujo.
            </h2>
            <p>
              Diseñado para solicitantes, compradores, bodegueros y finanzas. Control presupuestario por centro de costo, aprobación por roles sin autoaprobación y conciliación exacta de facturas.
            </p>

            <div className="flow" aria-label="Flujo de abastecimiento">
              <span>Requisición</span> <i>→</i>
              <span>Aprobación</span> <i>→</i>
              <span>Orden</span> <i>→</i>
              <span>Recepción</span> <i>→</i>
              <span>Factura</span> <i>→</i>
              <span>Pago</span>
            </div>

            <div className="btn-group" style={{ marginTop: '0.75rem' }}>
              {isAuthenticated ? (
                <Link to="/app" className="btn btn-primary btn-lg pill">
                  Abrir consola operativa <ArrowRight />
                </Link>
              ) : (
                <Link to="/login" className="btn btn-primary btn-lg pill">
                  Ingresar a consola operativa <ArrowRight />
                </Link>
              )}
              <Link to="/catalog" className="btn btn-outline-light btn-lg pill">
                Consultar catálogo público
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
