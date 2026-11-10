import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchCatalogCategories, fetchCatalogProducts } from '../services/catalogService.js';
import ProductCard from '../components/ProductCard.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PaginationBar from '../components/PaginationBar.jsx';

import pegboardWallUrl from '../assets/editorial/pared-herramientas.webp';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = searchParams.get('q') || '';
  const initialCategoryId = searchParams.get('category_id') || '';
  const initialUnitId = searchParams.get('unit_id') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialLimit = Number(searchParams.get('limit')) || 24;

  const [qInput, setQInput] = useState(initialQ);
  const [categoryIdInput, setCategoryIdInput] = useState(initialCategoryId);
  const [unitIdInput, setUnitIdInput] = useState(initialUnitId);
  const [brandInput, setBrandInput] = useState(initialBrand);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: initialPage, limit: initialLimit, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync inputs if URL params change externally
  useEffect(() => {
    setQInput(searchParams.get('q') || '');
    setCategoryIdInput(searchParams.get('category_id') || '');
    setUnitIdInput(searchParams.get('unit_id') || '');
    setBrandInput(searchParams.get('brand') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    fetchCatalogCategories({ page: 1, limit: 100 })
      .then((res) => {
        if (active) setCategories(res?.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const currentParams = {
      q: searchParams.get('q') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      unit_id: searchParams.get('unit_id') || undefined,
      brand: searchParams.get('brand') || undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 24,
    };

    try {
      const response = await fetchCatalogProducts(currentParams);
      setProducts(response?.data || []);
      setPagination(
        response?.pagination || {
          page: currentParams.page,
          limit: currentParams.limit,
          total: 0,
        }
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    const next = {};
    if (qInput.trim()) next.q = qInput.trim();
    if (categoryIdInput.trim()) next.category_id = categoryIdInput.trim();
    if (unitIdInput.trim()) next.unit_id = unitIdInput.trim();
    if (brandInput.trim()) next.brand = brandInput.trim();
    next.page = '1';
    next.limit = String(pagination.limit || 24);
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setQInput('');
    setCategoryIdInput('');
    setUnitIdInput('');
    setBrandInput('');
    setSearchParams({ page: '1', limit: '24' });
  };

  const handleCategoryChip = (catId) => {
    const next = Object.fromEntries(searchParams.entries());
    if (catId) {
      next.category_id = String(catId);
    } else {
      delete next.category_id;
    }
    next.page = '1';
    setSearchParams(next);
  };

  const removeSingleFilter = (key) => {
    const next = Object.fromEntries(searchParams.entries());
    delete next[key];
    next.page = '1';
    setSearchParams(next);
  };

  const handlePageChange = (nextPage) => {
    const next = Object.fromEntries(searchParams.entries());
    next.page = String(nextPage);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (nextLimit) => {
    const next = Object.fromEntries(searchParams.entries());
    next.limit = String(nextLimit);
    next.page = '1';
    setSearchParams(next);
  };

  const hasActiveFilters = Boolean(
    searchParams.get('q') ||
      searchParams.get('category_id') ||
      searchParams.get('unit_id') ||
      searchParams.get('brand')
  );

  const activeCategoryObj = categories.find(
    (c) => String(c.category_id) === String(searchParams.get('category_id'))
  );

  return (
    <div className="wrap">
      {/* CABECERA EDITORIAL */}
      <div className="page-head">
        <nav aria-label="Ruta de navegación">
          <ol className="breadcrumbs">
            <li><Link to="/">Inicio</Link></li>
            <li aria-current="page">Catálogo Público</li>
          </ol>
        </nav>

        <div className="page-head-grid">
          <div>
            <span className="eyebrow">Catálogo Público Activo</span>
            <h1 className="display display-l" style={{ marginTop: '0.4rem' }}>
              Herramientas, Fijaciones y Materiales
            </h1>
            <p className="lede" style={{ marginTop: '0.65rem' }}>
              Explora especificaciones técnicas estandarizadas y compara observaciones reales de precios por proveedor registradas en el sistema.
            </p>
          </div>

          <figure className="page-head-media" aria-hidden="true">
            <img
              src={pegboardWallUrl}
              alt=""
              width="1376"
              height="768"
            />
          </figure>
        </div>
      </div>

      {/* PANEL DE BÚSQUEDA Y FILTRADO */}
      <section className="filter-panel" aria-label="Filtros del catálogo">
        <form onSubmit={handleFilterSubmit}>
          <div className="filter-main">
            <div className="search-field">
              <SearchIcon />
              <input
                type="search"
                className="form-control"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Buscar por nombre, SKU o código de barras..."
                maxLength={100}
                aria-label="Término de búsqueda"
              />
            </div>

            <div>
              <label htmlFor="filter-category-select" className="sr-only">
                Categoría
              </label>
              <select
                id="filter-category-select"
                className="form-control"
                value={categoryIdInput}
                onChange={(e) => setCategoryIdInput(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-primary pill">
                Buscar
              </button>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="btn btn-ghost pill"
                  onClick={handleClearFilters}
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>

          {/* CHIPS RÁPIDOS DE CATEGORÍA */}
          {categories.length > 0 ? (
            <div style={{ marginTop: '0.85rem' }}>
              <div className="chip-row" role="tablist" aria-label="Filtro rápido de categorías">
                <button
                  type="button"
                  className={`chip ${!searchParams.get('category_id') ? 'is-active' : ''}`}
                  onClick={() => handleCategoryChip('')}
                >
                  Todas las categorías
                </button>
                {categories.map((cat) => {
                  const isActive = String(searchParams.get('category_id')) === String(cat.category_id);
                  return (
                    <button
                      key={cat.category_id}
                      type="button"
                      className={`chip ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleCategoryChip(cat.category_id)}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* FILTROS TÉCNICOS AVANZADOS */}
          <details className="filter-more">
            <summary>
              <span>Filtros técnicos adicionales</span>
              <ChevronDown />
            </summary>
            <div className="filter-more-grid">
              <div className="form-field">
                <label htmlFor="filter-unit" className="form-label">
                  ID Unidad de medida (unit_id)
                </label>
                <input
                  id="filter-unit"
                  type="number"
                  min="1"
                  step="1"
                  className="form-control mono"
                  value={unitIdInput}
                  onChange={(e) => setUnitIdInput(e.target.value)}
                  placeholder="Ej. 1"
                />
              </div>

              <div className="form-field">
                <label htmlFor="filter-brand-input" className="form-label">
                  Marca exacta (brand)
                </label>
                <input
                  id="filter-brand-input"
                  type="text"
                  maxLength={100}
                  className="form-control"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  placeholder="Ej. Truper, Stanley, Bellota..."
                />
              </div>

              <div className="form-field" style={{ justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-secondary pill">
                  Aplicar parámetros avanzados
                </button>
              </div>
            </div>
          </details>
        </form>

        {/* PILLS DE FILTROS ACTIVOS */}
        {hasActiveFilters ? (
          <div className="active-filters" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
            <span>Filtros aplicados:</span>
            {searchParams.get('q') ? (
              <button
                type="button"
                className="chip"
                onClick={() => removeSingleFilter('q')}
                title="Eliminar filtro de texto"
              >
                Texto: "{searchParams.get('q')}" <CloseIcon />
              </button>
            ) : null}
            {activeCategoryObj ? (
              <button
                type="button"
                className="chip"
                onClick={() => removeSingleFilter('category_id')}
                title="Eliminar filtro de categoría"
              >
                Categoría: {activeCategoryObj.name} <CloseIcon />
              </button>
            ) : null}
            {searchParams.get('unit_id') ? (
              <button
                type="button"
                className="chip"
                onClick={() => removeSingleFilter('unit_id')}
                title="Eliminar filtro de unidad"
              >
                Unidad #{searchParams.get('unit_id')} <CloseIcon />
              </button>
            ) : null}
            {searchParams.get('brand') ? (
              <button
                type="button"
                className="chip"
                onClick={() => removeSingleFilter('brand')}
                title="Eliminar filtro de marca"
              >
                Marca: {searchParams.get('brand')} <CloseIcon />
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* AVISOS DE ERROR */}
      <div style={{ marginTop: '1rem' }}>
        <ErrorAlert
          error={error}
          title="No se pudieron consultar los productos"
          onRetry={loadCatalog}
        />
      </div>

      {/* BARRA DE RESULTADOS */}
      <div className="results-bar">
        <div className="results-count">
          <strong>{pagination.total}</strong> producto(s) activo(s) en catálogo
        </div>

        {pagination.total > 0 ? (
          <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--steel)' }}>
            Página {pagination.page} de {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
          </div>
        ) : null}
      </div>

      {/* REJILLA DE PRODUCTOS O ESTADO VACÍO */}
      {loading ? (
        <SkeletonLoader rows={3} columns={3} label="Cargando artículos del catálogo..." />
      ) : products.length === 0 ? (
        <EmptyState
          folio="SIN RESULTADOS"
          title={
            hasActiveFilters
              ? 'Ningún artículo coincide con los filtros aplicados'
              : 'El catálogo público no tiene productos activos registrados'
          }
          description={
            hasActiveFilters
              ? 'Intenta con términos más generales, limpia el filtro de categoría o marca, o restablece los criterios.'
              : 'El endpoint público devolvió data: []. Los productos dados de alta con estado activo en MySQL aparecerán aquí.'
          }
        >
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn btn-primary pill"
              onClick={handleClearFilters}
            >
              Restablecer todos los filtros
            </button>
          ) : (
            <Link to="/login" className="btn btn-secondary pill">
              Acceso a gestión de maestros
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.product_id}
                product={product}
                indexFolio={`#${(pagination.page - 1) * pagination.limit + index + 1}`}
              />
            ))}
          </div>

          <PaginationBar
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalLabel="artículos"
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            allowedLimits={[12, 24, 48, 96]}
          />
        </>
      )}
    </div>
  );
}
