import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/AuthContext.jsx';
import {
  fetchSpendAnalytics,
  fetchSupplierEvaluationAnalytics,
  fetchReorderAnalytics,
} from '../services/operationsService.js';
import { formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';

export default function AnalyticsPage() {
  const { token, hasRole } = useAuth();
  const canSpend = hasRole('analyst', 'finance');
  const canEval = hasRole('analyst', 'buyer');
  const canReorder = hasRole('analyst', 'warehouse', 'buyer');

  // Spend state
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');
  const [spendData, setSpendData] = useState(null);
  const [spendMeta, setSpendMeta] = useState(null);
  const [loadingSpend, setLoadingSpend] = useState(false);
  const [spendError, setSpendError] = useState(null);

  // Evaluation state
  const [evaluationIdInput, setEvaluationIdInput] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState(null);

  // Reorder state
  const [reorderProductId, setReorderProductId] = useState('');
  const [reorderWarehouseId, setReorderWarehouseId] = useState('');
  const [reorderPage, setReorderPage] = useState(1);
  const [reorderLimit, setReorderLimit] = useState(25);
  const [reorderRows, setReorderRows] = useState([]);
  const [reorderPagination, setReorderPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingReorder, setLoadingReorder] = useState(false);
  const [reorderError, setReorderError] = useState(null);

  const handleLoadSpend = async (event) => {
    if (event) event.preventDefault();
    if (!canSpend) return;
    setLoadingSpend(true);
    setSpendError(null);
    try {
      const res = await fetchSpendAnalytics({ date_from: dateFrom, date_to: dateTo }, token);
      setSpendData(res?.data || []);
      setSpendMeta(res?.meta || null);
    } catch (err) {
      setSpendError(err);
    } finally {
      setLoadingSpend(false);
    }
  };

  const handleLoadEvaluation = async (event) => {
    event.preventDefault();
    if (!canEval || !evaluationIdInput.trim()) return;
    setLoadingEval(true);
    setEvalError(null);
    try {
      const res = await fetchSupplierEvaluationAnalytics(evaluationIdInput.trim(), token);
      setEvalResult(res?.data || null);
    } catch (err) {
      setEvalError(err);
      setEvalResult(null);
    } finally {
      setLoadingEval(false);
    }
  };

  const loadReorder = useCallback(async () => {
    if (!canReorder) return;
    setLoadingReorder(true);
    setReorderError(null);
    try {
      const res = await fetchReorderAnalytics(
        {
          product_id: reorderProductId.trim() || undefined,
          warehouse_id: reorderWarehouseId.trim() || undefined,
          page: reorderPage,
          limit: reorderLimit,
        },
        token
      );
      setReorderRows(res?.data || []);
      setReorderPagination(res?.pagination || { page: reorderPage, limit: reorderLimit, total: 0 });
    } catch (err) {
      setReorderError(err);
    } finally {
      setLoadingReorder(false);
    }
  }, [canReorder, token, reorderProductId, reorderWarehouseId, reorderPage, reorderLimit]);

  useEffect(() => {
    if (canReorder) {
      loadReorder();
    }
  }, [canReorder, loadReorder]);

  return (
    <div>
      <section className="page-masthead" aria-labelledby="analytics-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 08 DEL CIRCUITO — /api/operations/analytics/*</span>
          <h1 id="analytics-heading" className="page-title">
            Análisis de Gasto, Evaluación de Proveedores y Punto de Reorden
          </h1>
          <p className="page-description">
            Cálculos analíticos basados exclusivamente en registros reales en MySQL. No se fabrican métricas, ni se convierten monedas sin tasa, ni se infiere demanda de inventario a partir de compras.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">REGLAS DE TRANSPARENCIA ANALÍTICA</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              • <strong>Gasto:</strong> Suma de líneas de facturas <code>approved</code>, <code>partially_paid</code> o <code>paid</code> por moneda y categoría.<br />
              • <strong>Evaluación:</strong> Promedio ponderado sobre criterios registrados; sin ranking entre proveedores por falta de escala normalizada.<br />
              • <strong>Reorden:</strong> <code>demanda_diaria × plazo + stock_seguridad</code> usando políticas almacenadas.
            </p>
          </div>
        </div>
      </section>

      {/* 1. Spend Analysis */}
      <section className="section-block" aria-labelledby="spend-section-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">01 / GASTO — GET /api/operations/analytics/spend</span>
            <h2 id="spend-section-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Gasto Agrupado por Moneda y Categoría
            </h2>
          </div>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
            Roles: analyst, finance, admin
          </span>
        </div>

        <div className="section-body">
          {!canSpend ? (
            <EmptyState
              folio="PERMISO REQUERIDO"
              title="El análisis de gasto requiere rol analyst, finance o admin"
              description="Tu sesión actual no incluye permisos para consultar /api/operations/analytics/spend."
            />
          ) : (
            <>
              <form className="form-grid" onSubmit={handleLoadSpend} style={{ marginBottom: '1rem' }}>
                <div className="form-field">
                  <label htmlFor="spend-from" className="form-label">
                    Fecha inicial de factura (date_from, YYYY-MM-DD) *
                  </label>
                  <input
                    id="spend-from"
                    type="date"
                    required
                    className="form-control mono"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="spend-to" className="form-label">
                    Fecha final de factura (date_to, YYYY-MM-DD) *
                  </label>
                  <input
                    id="spend-to"
                    type="date"
                    required
                    className="form-control mono"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div className="form-field" style={{ justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={loadingSpend}>
                    {loadingSpend ? 'Calculando gasto...' : 'Consultar gasto por periodo'}
                  </button>
                </div>
              </form>

              <ErrorAlert error={spendError} title="Error al consultar el análisis de gasto" />

              {spendMeta ? (
                <div
                  className="mono"
                  style={{
                    padding: '0.65rem 1rem',
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--grid-hairline)',
                    marginBottom: '1rem',
                    fontSize: '0.78rem',
                  }}
                >
                  Meta: basis=<strong>{spendMeta.basis}</strong> | conversion=<strong>{spendMeta.conversion}</strong> | Periodo:{' '}
                  <strong>{spendMeta.date_from}</strong> a <strong>{spendMeta.date_to}</strong>
                </div>
              ) : null}

              {loadingSpend ? (
                <SkeletonLoader rows={2} columns={3} label="Consultando líneas de facturas aprobadas/pagadas..." />
              ) : spendData === null ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                  Selecciona un intervalo de fechas de factura y pulsa &ldquo;Consultar gasto por periodo&rdquo;.
                </p>
              ) : spendData.length === 0 ? (
                <EmptyState
                  folio="SIN GASTO EN EL PERIODO"
                  title="No hay líneas de facturas aprobadas o pagadas en ese rango de fechas"
                  description="El cálculo de gasto suma únicamente invoice_lines de facturas con estado approved, partially_paid o paid cuya invoice_date esté dentro del rango."
                />
              ) : (
                <div className="table-scroll">
                  <table className="swiss-table">
                    <thead>
                      <tr>
                        <th>Moneda (currency_code)</th>
                        <th>Categoría de Gasto (category_id)</th>
                        <th>Monto Total con Impuestos (total_amount)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spendData.map((row, idx) => (
                        <tr key={`${row.currency_code}-${row.category_id ?? 'null'}-${idx}`}>
                          <td className="mono">
                            <strong>{row.currency_code}</strong>
                          </td>
                          <td className="mono">
                            {row.category_id !== null && row.category_id !== undefined
                              ? `Categoría #${row.category_id}`
                              : 'Sin categoría'}
                          </td>
                          <td className="mono">
                            <strong>
                              {row.currency_code} {row.total_amount}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 2. Supplier Evaluation Calculation */}
      <section className="section-block" aria-labelledby="eval-section-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">
              02 / EVALUACIÓN — GET /api/operations/analytics/evaluations/:id
            </span>
            <h2 id="eval-section-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Consulta de Evaluación Ponderada de Proveedor
            </h2>
          </div>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
            Roles: analyst, buyer, admin
          </span>
        </div>

        <div className="section-body">
          {!canEval ? (
            <EmptyState
              folio="PERMISO REQUERIDO"
              title="La consulta de evaluaciones requiere rol analyst, buyer o admin"
              description="Tu sesión actual no tiene acceso a /api/operations/analytics/evaluations/:id."
            />
          ) : (
            <>
              <form className="btn-group" onSubmit={handleLoadEvaluation} style={{ marginBottom: '1rem' }}>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  className="form-control mono"
                  style={{ width: '220px' }}
                  placeholder="ID Evaluación (evaluation_id)"
                  value={evaluationIdInput}
                  onChange={(e) => setEvaluationIdInput(e.target.value)}
                  aria-label="ID de evaluación de proveedor"
                />
                <button type="submit" className="btn btn-primary" disabled={loadingEval}>
                  {loadingEval ? 'Consultando...' : 'Consultar evaluación'}
                </button>
              </form>

              <ErrorAlert error={evalError} title="No se pudo cargar la evaluación solicitada" />

              {loadingEval ? (
                <SkeletonLoader rows={2} columns={3} label="Calculando promedio ponderado..." />
              ) : !evalResult ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                  Ingresa un <code>evaluation_id</code> existente para calcular su suma de pesos (<code>weight_sum</code>), promedio ponderado (<code>weighted_average</code>) y desglose por criterio. La captura de nuevas evaluaciones permanece bloqueada hasta que Clavos defina la escala común y normalización de criterios.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="alert-banner alert-warning" style={{ marginBottom: 0 }}>
                    <div className="alert-title">Advertencia metodológica de escala (meta)</div>
                    <div className="alert-body mono" style={{ fontSize: '0.8rem' }}>
                      score_scale: <strong>{evalResult.meta?.score_scale}</strong> | cross_supplier_ranking:{' '}
                      <strong>{String(evalResult.meta?.cross_supplier_ranking)}</strong> | normalization:{' '}
                      <strong>{evalResult.meta?.normalization}</strong> | higher_is_better:{' '}
                      <strong>{evalResult.meta?.higher_is_better}</strong> | Pendiente definir:{' '}
                      {(evalResult.meta?.requires || []).join(', ')}
                    </div>
                  </div>

                  <div className="kv-grid">
                    <div className="kv-item">
                      <span className="kv-label">ID Evaluación (evaluation_id)</span>
                      <span className="kv-value mono">#{evalResult.evaluation_id}</span>
                    </div>
                    <div className="kv-item">
                      <span className="kv-label">ID Proveedor (supplier_id)</span>
                      <span className="kv-value mono">#{evalResult.supplier_id}</span>
                    </div>
                    <div className="kv-item">
                      <span className="kv-label">Suma de Pesos (weight_sum)</span>
                      <span className="kv-value mono">{evalResult.weight_sum}</span>
                    </div>
                    <div className="kv-item">
                      <span className="kv-label">Promedio Ponderado (weighted_average)</span>
                      <span className="kv-value mono" style={{ color: 'var(--accent-klein)' }}>
                        {evalResult.weighted_average ?? 'Sin puntajes (null)'}
                      </span>
                    </div>
                  </div>

                  <div className="table-scroll">
                    <table className="swiss-table">
                      <thead>
                        <tr>
                          <th>ID Score</th>
                          <th>Criterio</th>
                          <th>Dirección (higher_is_better)</th>
                          <th>Peso Usado (weight_used)</th>
                          <th>Puntaje (score)</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(evalResult.scores || []).map((sc) => (
                          <tr key={sc.evaluation_score_id || sc.criterion_id}>
                            <td className="mono">#{sc.evaluation_score_id}</td>
                            <td>
                              <strong>{sc.criterionId?.name || `Criterio #${sc.criterion_id}`}</strong>
                            </td>
                            <td className="mono">
                              {String(Boolean(sc.criterionId?.higher_is_better))}
                            </td>
                            <td className="mono">{sc.weight_used}</td>
                            <td className="mono">
                              <strong>{sc.score}</strong>
                            </td>
                            <td>{sc.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 3. Reorder Point Analytics */}
      <section className="section-block" aria-labelledby="reorder-section-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">03 / REORDEN — GET /api/operations/analytics/reorder</span>
            <h2 id="reorder-section-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Evaluación de Políticas de Stock y Punto de Reorden
            </h2>
          </div>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
            Roles: analyst, warehouse, buyer, admin
          </span>
        </div>

        <div className="section-body">
          {!canReorder ? (
            <EmptyState
              folio="PERMISO REQUERIDO"
              title="El cálculo de reorden requiere rol analyst, warehouse, buyer o admin"
              description="Tu sesión actual no tiene permisos para consultar /api/operations/analytics/reorder."
            />
          ) : (
            <>
              <form
                className="form-grid"
                style={{ marginBottom: '1rem' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  setReorderPage(1);
                  loadReorder();
                }}
              >
                <div className="form-field">
                  <label htmlFor="reorder-prod-id" className="form-label">
                    Filtrar por ID Producto (product_id, opcional)
                  </label>
                  <input
                    id="reorder-prod-id"
                    type="number"
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={reorderProductId}
                    onChange={(e) => setReorderProductId(e.target.value)}
                    placeholder="Todos los productos"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="reorder-wh-id" className="form-label">
                    Filtrar por ID Almacén (warehouse_id, opcional)
                  </label>
                  <input
                    id="reorder-wh-id"
                    type="number"
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={reorderWarehouseId}
                    onChange={(e) => setReorderWarehouseId(e.target.value)}
                    placeholder="Todos los almacenes"
                  />
                </div>

                <div className="form-field" style={{ justifyContent: 'flex-end' }}>
                  <div className="btn-group">
                    <button type="submit" className="btn btn-primary" disabled={loadingReorder}>
                      Filtrar políticas
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setReorderProductId('');
                        setReorderWarehouseId('');
                        setReorderPage(1);
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </form>

              <ErrorAlert error={reorderError} title="Error al consultar el cálculo de reorden" onRetry={loadReorder} />

              {loadingReorder ? (
                <SkeletonLoader rows={3} columns={4} label="Calculando puntos de reorden e inventario disponible..." />
              ) : reorderRows.length === 0 ? (
                <EmptyState
                  folio="SIN POLÍTICAS DE STOCK CONFIGURADAS"
                  title="No existen políticas product_warehouse_policies registradas para estos filtros"
                  description="Un administrador puede registrar políticas de stock y reorden por producto y almacén desde el módulo de Maestros y Reglas."
                />
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="swiss-table">
                      <thead>
                        <tr>
                          <th>Producto / Almacén</th>
                          <th>Disponible Actual (available)</th>
                          <th>Reorden Configurado vs Calculado</th>
                          <th>¿Requiere Reorden? (needs_reorder)</th>
                          <th>Parámetros Almacenados (inputs) y Faltantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reorderRows.map((row) => (
                          <tr key={`${row.product_id}-${row.warehouse_id}`}>
                            <td className="mono">
                              <strong>Prod #{row.product_id}</strong> | Almacén #{row.warehouse_id}
                            </td>
                            <td className="mono">
                              <strong>{row.available}</strong>
                            </td>
                            <td className="mono">
                              <div>Configurado: {row.configured_reorder_point}</div>
                              <div>
                                Calculado:{' '}
                                <strong>
                                  {row.calculated_reorder_point !== null
                                    ? row.calculated_reorder_point
                                    : 'No calculable (null)'}
                                </strong>
                              </div>
                            </td>
                            <td>
                              {row.needs_reorder === null ? (
                                <StatusBadge
                                  customLabel="Datos insuficientes (null)"
                                  toneOverride="warning"
                                />
                              ) : row.needs_reorder ? (
                                <StatusBadge
                                  customLabel="SÍ — Reabastecer (available <= punto)"
                                  toneOverride="danger"
                                />
                              ) : (
                                <StatusBadge
                                  customLabel="NO — Stock suficiente"
                                  toneOverride="success"
                                />
                              )}
                            </td>
                            <td className="mono" style={{ fontSize: '0.78rem' }}>
                              <div>
                                Demanda diaria: {row.inputs?.average_daily_demand ?? 'null'} | Plazo:{' '}
                                {row.inputs?.lead_time_days ?? 'null'} d | Seg:{' '}
                                {row.inputs?.safety_stock ?? '0.000'}
                              </div>
                              <div>
                                Fecha política: {formatUtcDateTime(row.inputs?.last_calculated_at)} | Fuente:{' '}
                                {row.demand_source}
                              </div>
                              {row.missing && row.missing.length > 0 ? (
                                <div style={{ color: 'var(--status-warning-text)', marginTop: '0.2rem' }}>
                                  Falta: {row.missing.join(', ')}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <PaginationBar
                    page={reorderPagination.page}
                    limit={reorderPagination.limit}
                    total={reorderPagination.total}
                    totalLabel="políticas de almacén"
                    onPageChange={setReorderPage}
                    onLimitChange={(lim) => {
                      setReorderLimit(lim);
                      setReorderPage(1);
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
