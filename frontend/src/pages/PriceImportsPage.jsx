import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/AuthContext.jsx';
import {
  importPriceObservationsBatch,
  listPriceImportBatches,
  getPriceImportBatchDetail,
  parseImportBatchErrorSummary,
} from '../services/adminService.js';
import { formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';

export default function PriceImportsPage() {
  const { token, hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Batch submission state
  const [priceSourceId, setPriceSourceId] = useState('');
  const [rows, setRows] = useState([
    {
      key: 'row-1',
      supplier_product_id: '',
      observed_at: '2026-11-09T14:00:00Z',
      unit_price: '',
      currency_code: 'CRC',
      price_includes_tax: true,
      available_quantity: '',
      source_product_url: '',
      external_reference: '',
      is_validated: true,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastBatchResult, setLastBatchResult] = useState(null);

  // Batch history & detail state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchesError, setBatchesError] = useState(null);

  const [lookupBatchId, setLookupBatchId] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loadingBatchDetail, setLoadingBatchDetail] = useState(false);
  const [batchDetailError, setBatchDetailError] = useState(null);

  const loadBatches = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingBatches(true);
    setBatchesError(null);
    try {
      const res = await listPriceImportBatches(token, { page, limit });
      setBatches(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setBatchesError(err);
    } finally {
      setLoadingBatches(false);
    }
  }, [isAdmin, token, page, limit]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const loadBatchDetail = useCallback(
    async (idToLoad) => {
      if (!idToLoad) return;
      setLoadingBatchDetail(true);
      setBatchDetailError(null);
      try {
        const res = await getPriceImportBatchDetail(idToLoad, token);
        setSelectedBatch(res?.data || null);
      } catch (err) {
        setBatchDetailError(err);
      } finally {
        setLoadingBatchDetail(false);
      }
    },
    [token]
  );

  const handleAddRow = () => {
    if (rows.length >= 100) return;
    setRows((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${prev.length + 1}`,
        supplier_product_id: '',
        observed_at: '2026-11-09T14:00:00Z',
        unit_price: '',
        currency_code: 'CRC',
        price_includes_tax: true,
        available_quantity: '',
        source_product_url: '',
        external_reference: '',
        is_validated: true,
      },
    ]);
  };

  const handleRemoveRow = (keyToRemove) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== keyToRemove) : prev));
  };

  const handleRowChange = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const handleSubmitImport = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setLastBatchResult(null);

    try {
      const payload = {
        price_source_id: Number(priceSourceId),
        price_basis: 'per_purchase_unit',
        rows: rows.map((r) => ({
          supplier_product_id: Number(r.supplier_product_id),
          observed_at: String(r.observed_at).trim(),
          unit_price: String(r.unit_price).trim(),
          currency_code: String(r.currency_code).trim().toUpperCase(),
          price_includes_tax: Boolean(r.price_includes_tax),
          available_quantity:
            r.available_quantity !== '' && r.available_quantity !== null
              ? String(r.available_quantity).trim()
              : null,
          source_product_url:
            r.source_product_url && r.source_product_url.trim() !== ''
              ? r.source_product_url.trim()
              : null,
          external_reference:
            r.external_reference && r.external_reference.trim() !== ''
              ? r.external_reference.trim()
              : null,
          is_validated: Boolean(r.is_validated),
        })),
      };

      const res = await importPriceObservationsBatch(payload, token);
      const batchResult = res?.data;
      setLastBatchResult(batchResult || null);
      await loadBatches();
      if (batchResult?.import_batch_id) {
        await loadBatchDetail(batchResult.import_batch_id);
      }
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const parsedSelectedSummary = selectedBatch
    ? parseImportBatchErrorSummary(selectedBatch.error_summary)
    : null;

  return (
    <div>
      <section className="page-masthead" aria-labelledby="price-imports-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">ADMINISTRACIÓN — POST /api/admin/price-imports</span>
          <h1 id="price-imports-heading" className="page-title">
            Importación Autorizada de Observaciones de Precios
          </h1>
          <p className="page-description">
            Registro por lotes de hasta 100 observaciones históricas verificadas con declaración obligatoria de <code>price_basis: &quot;per_purchase_unit&quot;</code> y auditoría detallada de rechazos por fila.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">ALCANCE DE EPA Y PROCEDENCIA</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              El backend no hace scraping ni consulta endpoints privados de EPA. Solo deben importarse observaciones reales cuya fuente (<code>price_sources</code>) esté autorizada. Una observación duplicada (misma fuente + producto equivalente + <code>observed_at</code>) se rechaza con <code>DUPLICATE_OBSERVATION</code> sin sobrescribir la original.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            observed_at requiere ISO UTC con precisión de segundos (ej. 2026-11-09T14:00:00Z) y no puede ser futuro.
          </div>
        </div>
      </section>

      {!isAdmin ? (
        <EmptyState
          folio="ACCESO EXCLUSIVO ADMIN"
          title="La importación de precios y consulta de lotes requiere el rol admin"
          description="Inicia sesión con una cuenta que tenga asignado el rol admin para ejecutar importaciones o consultar price_import_batches."
        />
      ) : (
        <>
          <ErrorAlert error={submitError} title="Error al procesar el lote de importación" />

          {lastBatchResult ? (
            <section className="section-block" aria-labelledby="last-batch-result-heading">
              <div className="section-header">
                <div>
                  <span className="folio-num">
                    RESULTADO DEL LOTE #{lastBatchResult.import_batch_id} (HTTP 201)
                  </span>
                  <h2 id="last-batch-result-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                    Resumen de Filas Recibidas, Importadas y Rechazadas
                  </h2>
                </div>
                <StatusBadge status={lastBatchResult.status} />
              </div>
              <div className="section-body">
                <div className="kv-grid" style={{ marginBottom: '1rem' }}>
                  <div className="kv-item">
                    <span className="kv-label">Lote (import_batch_id)</span>
                    <span className="kv-value mono">#{lastBatchResult.import_batch_id}</span>
                  </div>
                  <div className="kv-item">
                    <span className="kv-label">Recibidas (records_received)</span>
                    <span className="kv-value mono">{lastBatchResult.records_received}</span>
                  </div>
                  <div className="kv-item">
                    <span className="kv-label">Importadas (records_imported)</span>
                    <span className="kv-value mono" style={{ color: 'var(--status-success-text)' }}>
                      {lastBatchResult.records_imported}
                    </span>
                  </div>
                  <div className="kv-item">
                    <span className="kv-label">Rechazadas (records_rejected)</span>
                    <span className="kv-value mono" style={{ color: 'var(--status-danger-text)' }}>
                      {lastBatchResult.records_rejected}
                    </span>
                  </div>
                </div>

                {Array.isArray(lastBatchResult.errors) && lastBatchResult.errors.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--status-danger-text)' }}>
                      Detalle de Errores por Fila ({lastBatchResult.errors.length})
                    </h3>
                    <div className="table-scroll">
                      <table className="swiss-table">
                        <thead>
                          <tr>
                            <th>Fila (row)</th>
                            <th>Código de Error (code)</th>
                            <th>Mensaje (message)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lastBatchResult.errors.map((errItem, i) => (
                            <tr key={`${errItem.row}-${i}`}>
                              <td className="mono">
                                <strong>Fila #{errItem.row ?? '—'}</strong>
                              </td>
                              <td className="mono">
                                <span className="badge badge-danger">{errItem.code}</span>
                              </td>
                              <td>{errItem.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="alert-banner alert-success" style={{ marginBottom: 0 }}>
                    <div className="alert-title">Lote importado sin rechazos</div>
                    <div className="alert-body">
                      Todas las filas del lote cumplieron las validaciones de esquema y referencias activas.
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Import Form */}
          <section className="section-block" aria-labelledby="import-form-heading">
            <div className="section-header">
              <div>
                <span className="folio-num">CAPTURA DE LOTE — POST /api/admin/price-imports</span>
                <h2 id="import-form-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                  Registrar Nuevas Observaciones de Precios Reales
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleAddRow}
                disabled={rows.length >= 100}
              >
                Añadir fila ({rows.length}/100)
              </button>
            </div>

            <form className="section-body" onSubmit={handleSubmitImport}>
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-field">
                  <label htmlFor="imp-source-id" className="form-label">
                    ID Fuente de Precios Activa (price_source_id) *
                  </label>
                  <input
                    id="imp-source-id"
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={priceSourceId}
                    onChange={(e) => setPriceSourceId(e.target.value)}
                    placeholder="ID en tabla price_sources"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="imp-price-basis" className="form-label">
                    Base de Precio Declarada (price_basis) *
                  </label>
                  <input
                    id="imp-price-basis"
                    type="text"
                    readOnly
                    className="form-control mono"
                    value="per_purchase_unit"
                  />
                  <span className="form-helper">
                    Declara que unit_price y available_quantity corresponden a la unidad de compra de supplier_products.
                  </span>
                </div>
              </div>

              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID Equivalente (supplier_product_id) *</th>
                      <th>Fecha UTC (observed_at, ISO Z) *</th>
                      <th>Precio Unitario (4 dec.) *</th>
                      <th>Moneda *</th>
                      <th>Cant. Disp. (3 dec.)</th>
                      <th>URL HTTP(S) / Ref. Externa</th>
                      <th>Impuesto / Validado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, index) => (
                      <tr key={r.key}>
                        <td className="mono">{index + 1}</td>
                        <td>
                          <input
                            type="number"
                            required
                            min="1"
                            step="1"
                            className="form-control mono"
                            value={r.supplier_product_id}
                            onChange={(e) =>
                              handleRowChange(r.key, 'supplier_product_id', e.target.value)
                            }
                            placeholder="ID equiv."
                            aria-label={`Fila ${index + 1} ID producto equivalente`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            required
                            className="form-control mono"
                            value={r.observed_at}
                            onChange={(e) => handleRowChange(r.key, 'observed_at', e.target.value)}
                            placeholder="2026-11-09T14:00:00Z"
                            aria-label={`Fila ${index + 1} fecha de observación`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            required
                            className="form-control mono"
                            value={r.unit_price}
                            onChange={(e) => handleRowChange(r.key, 'unit_price', e.target.value)}
                            placeholder="Precio real (4 dec)"
                            aria-label={`Fila ${index + 1} precio unitario`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            required
                            maxLength={3}
                            className="form-control mono"
                            style={{ width: '75px' }}
                            value={r.currency_code}
                            onChange={(e) =>
                              handleRowChange(r.key, 'currency_code', e.target.value.toUpperCase())
                            }
                            aria-label={`Fila ${index + 1} moneda`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control mono"
                            value={r.available_quantity}
                            onChange={(e) =>
                              handleRowChange(r.key, 'available_quantity', e.target.value)
                            }
                            placeholder="Opcional"
                            aria-label={`Fila ${index + 1} cantidad disponible`}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <input
                              type="text"
                              className="form-control mono"
                              value={r.source_product_url}
                              onChange={(e) =>
                                handleRowChange(r.key, 'source_product_url', e.target.value)
                              }
                              placeholder="https://... (opcional)"
                              aria-label={`Fila ${index + 1} URL de procedencia`}
                            />
                            <input
                              type="text"
                              className="form-control mono"
                              value={r.external_reference}
                              onChange={(e) =>
                                handleRowChange(r.key, 'external_reference', e.target.value)
                              }
                              placeholder="Ref. externa (opcional)"
                              aria-label={`Fila ${index + 1} referencia externa`}
                            />
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label className="checkbox-row" style={{ minHeight: 'auto' }}>
                              <input
                                type="checkbox"
                                checked={r.price_includes_tax}
                                onChange={(e) =>
                                  handleRowChange(r.key, 'price_includes_tax', e.target.checked)
                                }
                              />
                              <span>Con IVA</span>
                            </label>
                            <label className="checkbox-row" style={{ minHeight: 'auto' }}>
                              <input
                                type="checkbox"
                                checked={r.is_validated}
                                onChange={(e) =>
                                  handleRowChange(r.key, 'is_validated', e.target.checked)
                                }
                              />
                              <span>Validado</span>
                            </label>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            disabled={rows.length <= 1}
                            onClick={() => handleRemoveRow(r.key)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="btn-group" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Importando lote...' : 'Ejecutar importación de lote (POST)'}
                </button>
              </div>
            </form>
          </section>

          {/* Persisted Batch Detail Inspection */}
          <section className="section-block" aria-labelledby="batch-detail-heading">
            <div className="section-header">
              <div>
                <span className="folio-num">
                  CONSULTA PERSISTIDA — GET /api/price_import_batches/:import_batch_id
                </span>
                <h2 id="batch-detail-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                  Inspeccionar Lote Persistido y Resumen de Errores (error_summary)
                </h2>
              </div>

              <form
                className="btn-group"
                onSubmit={(e) => {
                  e.preventDefault();
                  loadBatchDetail(lookupBatchId.trim());
                }}
              >
                <input
                  type="number"
                  min="1"
                  className="form-control mono"
                  style={{ width: '170px', minHeight: '38px' }}
                  placeholder="ID lote..."
                  value={lookupBatchId}
                  onChange={(e) => setLookupBatchId(e.target.value)}
                  aria-label="ID de lote de importación"
                />
                <button type="submit" className="btn btn-sm btn-secondary">
                  Cargar lote
                </button>
              </form>
            </div>

            <div className="section-body">
              <ErrorAlert error={batchDetailError} title="Error al consultar el lote" />

              {loadingBatchDetail ? (
                <SkeletonLoader rows={2} columns={3} label="Cargando lote persistido..." />
              ) : !selectedBatch ? (
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
                  Selecciona un lote de la tabla inferior o ingresa su ID para examinar su sobre JSON <code>error_summary</code>.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="kv-grid">
                    <div className="kv-item">
                      <span className="kv-label">ID Lote / Estado</span>
                      <span className="kv-value mono">
                        #{selectedBatch.import_batch_id} — <StatusBadge status={selectedBatch.status} />
                      </span>
                    </div>
                    <div className="kv-item">
                      <span className="kv-label">Fuente / Usuario</span>
                      <span className="kv-value mono">
                        Fuente #{selectedBatch.price_source_id} | Usuario #{selectedBatch.imported_by_user_id}
                      </span>
                    </div>
                    <div className="kv-item">
                      <span className="kv-label">Conteos (Rec / Imp / Rech)</span>
                      <span className="kv-value mono">
                        {selectedBatch.records_received} / {selectedBatch.records_imported} /{' '}
                        {selectedBatch.records_rejected}
                      </span>
                    </div>
                    <div className="kv-item">
                      <span className="kv-label">Inicio / Fin</span>
                      <span className="kv-value mono" style={{ fontSize: '0.78rem' }}>
                        {formatUtcDateTime(selectedBatch.started_at)} →{' '}
                        {formatUtcDateTime(selectedBatch.completed_at)}
                      </span>
                    </div>
                  </div>

                  {parsedSelectedSummary ? (
                    <div
                      className="mono"
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--surface-canvas)',
                        border: '1px solid var(--grid-hairline)',
                        fontSize: '0.8rem',
                      }}
                    >
                      Sobre JSON error_summary: version=<strong>{parsedSelectedSummary.version ?? '—'}</strong> | price_basis=<strong>{parsedSelectedSummary.price_basis ?? '—'}</strong> | availability_basis=<strong>{parsedSelectedSummary.availability_basis ?? '—'}</strong>
                    </div>
                  ) : null}

                  {parsedSelectedSummary?.errors?.length > 0 ? (
                    <div className="table-scroll">
                      <table className="swiss-table">
                        <thead>
                          <tr>
                            <th>Fila (row)</th>
                            <th>Código (code)</th>
                            <th>Mensaje (message)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedSelectedSummary.errors.map((errItem, idx) => (
                            <tr key={`${errItem.row ?? idx}-${idx}`}>
                              <td className="mono">{errItem.row ? `Fila #${errItem.row}` : 'Lote'}</td>
                              <td className="mono">
                                <span className="badge badge-danger">{errItem.code}</span>
                              </td>
                              <td>{errItem.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          {/* Batches History Table */}
          <section className="section-block" aria-labelledby="batches-list-heading">
            <div className="section-header">
              <div>
                <span className="folio-num">HISTORIAL — GET /api/price_import_batches</span>
                <h2 id="batches-list-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                  Lotes de Importación Registrados
                </h2>
              </div>
              <button type="button" className="btn btn-sm btn-secondary" onClick={loadBatches}>
                Actualizar
              </button>
            </div>

            <div className="section-body">
              <ErrorAlert error={batchesError} title="Error al listar lotes" onRetry={loadBatches} />

              {loadingBatches ? (
                <SkeletonLoader rows={2} columns={4} label="Consultando price_import_batches..." />
              ) : batches.length === 0 ? (
                <EmptyState
                  folio="SIN LOTES DE IMPORTACIÓN"
                  title="No se han ejecutado lotes de importación de precios todavía"
                  description="Los lotes creados mediante POST /api/admin/price-imports quedan auditados en esta tabla."
                />
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="swiss-table">
                      <thead>
                        <tr>
                          <th>ID Lote</th>
                          <th>Fuente (price_source_id)</th>
                          <th>Recibidas / Importadas / Rechazadas</th>
                          <th>Estado</th>
                          <th>Completado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((b) => (
                          <tr key={b.import_batch_id}>
                            <td className="mono">
                              <strong>#{b.import_batch_id}</strong>
                            </td>
                            <td className="mono">Fuente #{b.price_source_id}</td>
                            <td className="mono">
                              {b.records_received} / <strong>{b.records_imported}</strong> /{' '}
                              <span style={{ color: b.records_rejected > 0 ? 'var(--status-danger-text)' : 'inherit' }}>
                                {b.records_rejected}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="mono">{formatUtcDateTime(b.completed_at)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => loadBatchDetail(b.import_batch_id)}
                              >
                                Inspeccionar errores
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <PaginationBar
                    page={pagination.page}
                    limit={pagination.limit}
                    total={pagination.total}
                    totalLabel="lotes de importación"
                    onPageChange={setPage}
                    onLimitChange={(lim) => {
                      setLimit(lim);
                      setPage(1);
                    }}
                  />
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
