import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchCatalogCategories, fetchCatalogProducts } from '../services/catalogService.js';
import ProductCard from '../components/ProductCard.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PaginationBar from '../components/PaginationBar.jsx';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = searchParams.get('q') || '';
  const initialCategoryId = searchParams.get('category_id') || '';
  const initialUnitId = searchParams.get('unit_id') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialLimit = Number(searchParams.get('limit')) || 25;

  const [qInput, setQInput] = useState(initialQ);
  const [categoryIdInput, setCategoryIdInput] = useState(initialCategoryId);
  const [unitIdInput, setUnitIdInput] = useState(initialUnitId);
  const [brandInput, setBrandInput] = useState(initialBrand);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: initialPage, limit: initialLimit, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchCatalogCategories({ page: 1, limit: 100 })
      .then((res) => {
        if (active) setCategories(res?.data || []);
      })
      .catch(() => {
        // Error surfaced by main products query if server is down
      });
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
      limit: Number(searchParams.get('limit')) || 25,
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
    next.limit = String(pagination.limit || 25);
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setQInput('');
    setCategoryIdInput('');
    setUnitIdInput('');
    setBrandInput('');
    setSearchParams({ page: '1', limit: '25' });
  };

  const handlePageChange = (nextPage) => {
    const next = Object.fromEntries(searchParams.entries());
    next.page = String(nextPage);
    setSearchParams(next);
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

  return (
    <div>
      <section className="page-masthead" aria-labelledby="catalog-title">
        <div className="page-masthead-primary">
          <span className="folio-num">FOLIO 02 — CONSULTA PÚBLICA</span>
          <h1 id="catalog-title" className="page-title">
            Catálogo Público de Productos Activos
          </h1>
          <p className="page-description">
            Consulta directa sobre <code>GET /api/catalog/products</code>. Permite buscar por coincidencia en nombre, SKU o código de barras, y filtrar por categoría activa, ID de unidad de medida o marca exacta.
          </p>
        </div>
        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">PARÁMETROS DE CONSULTA</span>
            <p style={{ marginTop: '0.25rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              Orden estable por <code>product_id ASC</code>. Límite predeterminado de 25 registros por página (máximo 100). Los filtros desconocidos se rechazan con HTTP 400.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.8rem' }}>
            Total encontrados: <strong>{pagination.total}</strong> producto(s)
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="filters-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">FILTROS DEL SERVIDOR</span>
            <h2 id="filters-heading" style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>
              Búsqueda y Filtrado Técnico
            </h2>
          </div>
          {hasActiveFilters ? (
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleClearFilters}>
              Limpiar todos los filtros
            </button>
          ) : null}
        </div>
        <form className="section-body" onSubmit={handleFilterSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="filter-q" className="form-label">
                Búsqueda (q: Nombre, SKU o Barcode)
              </label>
              <input
                id="filter-q"
                type="text"
                className="form-control"
                maxLength={100}
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Ej. clavo, martillo, SKU..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="filter-category" className="form-label">
                Categoría activa (category_id)
              </label>
              <select
                id="filter-category"
                className="form-control"
                value={categoryIdInput}
                onChange={(e) => setCategoryIdInput(e.target.value)}
              >
                <option value="">Todas las categorías activas</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    #{cat.category_id} — {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="filter-unit-id" className="form-label">
                ID Unidad de medida (unit_id)
              </label>
              <input
                id="filter-unit-id"
                type="number"
                min="1"
                step="1"
                className="form-control mono"
                value={unitIdInput}
                onChange={(e) => setUnitIdInput(e.target.value)}
                placeholder="Entero positivo (opcional)"
              />
            </div>

            <div className="form-field">
              <label htmlFor="filter-brand" className="form-label">
                Marca exacta (brand)
              </label>
              <input
                id="filter-brand"
                type="text"
                maxLength={100}
                className="form-control"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                placeholder="Nombre de marca (opcional)"
              />
            </div>
          </div>

          <div className="btn-group" style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              Aplicar filtros en el servidor
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadCatalog}>
              Actualizar lista
            </button>
          </div>
        </form>
      </section>

      <ErrorAlert error={error} title="Error al consultar el catálogo de productos" onRetry={loadCatalog} />

      {loading ? (
        <SkeletonLoader rows={2} columns={3} label="Cargando productos desde GET /api/catalog/products..." />
      ) : products.length === 0 ? (
        <EmptyState
          folio="SIN RESULTADOS EN CATÁLOGO"
          title={
            hasActiveFilters
              ? 'Ningún producto activo coincide con los filtros seleccionados'
              : 'El catálogo público no tiene productos activos registrados'
          }
          description={
            hasActiveFilters
              ? 'Puedes limpiar los criterios de búsqueda o verificar que la categoría, marca o unidad seleccionada tenga productos activos.'
              : 'El endpoint GET /api/catalog/products devolvió una lista vacía (data: []). Cuando se den de alta productos activos con categoría activa y unidad de medida, se listarán en esta cuadrícula.'
          }
        >
          {hasActiveFilters ? (
            <button type="button" className="btn btn-primary" onClick={handleClearFilters}>
              Restablecer filtros
            </button>
          ) : (
            <Link to="/login" className="btn btn-secondary">
              Acceso administrativo
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="swiss-grid swiss-grid-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.product_id}
                product={product}
                indexFolio={`PÁG ${pagination.page} · #${(pagination.page - 1) * pagination.limit + index + 1}`}
              />
            ))}
          </div>

          <PaginationBar
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalLabel="productos activos"
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </div>
  );
}
