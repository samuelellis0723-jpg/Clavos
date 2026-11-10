import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import {
  listOperationDocuments,
  getOperationDocumentDetail,
  registerOrderReceipt,
} from '../services/operationsService.js';
import { formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function ReceiptsPage() {
  const { token, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const canRead = hasRole('buyer', 'warehouse', 'finance');
  const canWrite = hasRole('warehouse');

  const initialOrderId = searchParams.get('order_id') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  // Receipt detail inspection
  const [lookupReceiptId, setLookupReceiptId] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Register receipt form
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [loadedOrder, setLoadedOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptLinesForm, setReceiptLinesForm] = useState([]);
  const [confirmReceiptOpen, setConfirmReceiptOpen] = useState(false);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadReceipts = useCallback(async () => {
    if (!canRead) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await listOperationDocuments('receipts', token, {
        page,
        limit,
        status: statusFilter || undefined,
      });
      setReceipts(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setListError(err);
    } finally {
      setLoadingList(false);
    }
  }, [canRead, token, page, limit, statusFilter]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const loadReceiptDetail = useCallback(
    async (receiptId) => {
      if (!receiptId) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await getOperationDocumentDetail('receipts', receiptId, token);
        setSelectedReceipt(res?.data || null);
      } catch (err) {
        setDetailError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  const handleLoadOrderForReceipt = useCallback(
    async (ordId) => {
      if (!ordId) return;
      setLoadingOrder(true);
      setCreateError(null);
      try {
        const res = await getOperationDocumentDetail('orders', ordId, token);
        const ord = res?.data;
        setLoadedOrder(ord || null);
        if (ord?.lines) {
          setReceiptLinesForm(
            ord.lines.map((pol) => ({
              purchase_order_line_id: pol.purchase_order_line_id,
              product_id: pol.product_id,
              quantity_ordered: pol.quantity_ordered,
              include: true,
              quantity_received: pol.quantity_ordered,
              quantity_accepted: pol.quantity_ordered,
              quantity_rejected: '0.000',
              rejection_reason: '',
            }))
          );
        }
      } catch (err) {
        setCreateError(err);
      } finally {
        setLoadingOrder(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (initialOrderId && canWrite) {
      handleLoadOrderForReceipt(initialOrderId);
    }
  }, [initialOrderId, canWrite, handleLoadOrderForReceipt]);

  const handleReceiptLineChange = (poLineId, field, value) => {
    setReceiptLinesForm((prev) =>
      prev.map((item) =>
        item.purchase_order_line_id === poLineId ? { ...item, [field]: value } : item
      )
    );
  };

  const handlePrepareReceiptSubmit = (event) => {
    event.preventDefault();
    setCreateError(null);
    const activeLines = receiptLinesForm.filter((l) => l.include);
    if (!activeLines.length) {
      setCreateError('Selecciona al menos una línea de la orden para registrar en la recepción.');
      return;
    }
    setConfirmReceiptOpen(true);
  };

  const handleConfirmRegisterReceipt = async () => {
    if (!loadedOrder) return;
    setSubmittingReceipt(true);
    setCreateError(null);
    setActionSuccess(null);

    try {
      const activeLines = receiptLinesForm.filter((l) => l.include);
      const payload = {
        receipt_number: receiptNumber.trim(),
        warehouse_id: Number(warehouseId),
        lines: activeLines.map((l) => {
          const lineObj = {
            purchase_order_line_id: Number(l.purchase_order_line_id),
            quantity_received: String(l.quantity_received).trim(),
            quantity_accepted: String(l.quantity_accepted).trim(),
            quantity_rejected: String(l.quantity_rejected).trim(),
          };
          if (l.rejection_reason && l.rejection_reason.trim() !== '') {
            lineObj.rejection_reason = l.rejection_reason.trim();
          }
          return lineObj;
        }),
      };

      const res = await registerOrderReceipt(loadedOrder.purchase_order_id, payload, token);
      const created = res?.data;
      setConfirmReceiptOpen(false);
      setActionSuccess(
        `Recepción #${created?.receipt_id} (${created?.receipt_number}) registrada en estado ${
          created?.status || 'posted'
        }. Las cantidades aceptadas de productos inventariables generaron movimientos de entrada en el almacén #${warehouseId}.`
      );
      setReceiptNumber('');
      await loadReceipts();
      if (created?.receipt_id) {
        await loadReceiptDetail(created.receipt_id);
      }
      await handleLoadOrderForReceipt(loadedOrder.purchase_order_id);
    } catch (err) {
      setConfirmReceiptOpen(false);
      setCreateError(err);
    } finally {
      setSubmittingReceipt(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="receipts-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 04 DEL CIRCUITO — /api/operations/receipts</span>
          <h1 id="receipts-heading" className="page-title">
            Recepción de Mercancía y Entrada a Inventario
          </h1>
          <p className="page-description">
            Registro de recepciones totales o parciales sobre órdenes en estado <code>sent</code>, <code>acknowledged</code> o <code>partially_received</code>.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">REGLAS DE CONCILIACIÓN FÍSICA</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              En cada línea debe cumplirse <code>quantity_accepted + quantity_rejected = quantity_received</code> sin superar el saldo pendiente de la orden. Si <code>quantity_rejected &gt; 0</code>, es obligatorio indicar <code>rejection_reason</code>. Solo las unidades aceptadas de productos <code>is_stockable</code> suman al stock del almacén.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            Al completar todas las líneas aceptadas, la orden pasa a <code>received</code>.
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Recepción contabilizada</div>
          <div className="alert-body">{actionSuccess}</div>
        </div>
      ) : null}

      {/* Receipt Detail */}
      <section className="section-block" aria-labelledby="receipt-detail-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">DETALLE DE RECEPCIÓN — GET /api/operations/receipts/:id</span>
            <h2 id="receipt-detail-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Inspeccionar Recepción y Líneas Recibidas
            </h2>
          </div>

          <form
            className="btn-group"
            onSubmit={(e) => {
              e.preventDefault();
              loadReceiptDetail(lookupReceiptId.trim());
            }}
          >
            <input
              type="number"
              min="1"
              className="form-control mono"
              style={{ width: '170px', minHeight: '38px' }}
              placeholder="ID recepción..."
              value={lookupReceiptId}
              onChange={(e) => setLookupReceiptId(e.target.value)}
              aria-label="ID de recepción a consultar"
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cargar recepción
            </button>
          </form>
        </div>

        <div className="section-body">
          <ErrorAlert error={detailError} title="Error al consultar la recepción" />

          {loadingDetail ? (
            <SkeletonLoader rows={2} columns={3} label="Cargando recepción..." />
          ) : !selectedReceipt ? (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
              Selecciona una recepción de la tabla inferior o ingresa su ID para revisar las cantidades recibidas, aceptadas y rechazadas (<code>receipt_lines</code>).
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="folio-num">RECEPCIÓN #{selectedReceipt.receipt_id}</span>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedReceipt.receipt_number}</h3>
                </div>
                <div className="btn-group">
                  <StatusBadge status={selectedReceipt.status} />
                  <Link to="/app/inventory" className="btn btn-sm btn-secondary">
                    Consultar saldos de inventario
                  </Link>
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Orden de Compra (purchase_order_id)</span>
                  <span className="kv-value mono">#{selectedReceipt.purchase_order_id}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Recibido por (received_by_user_id)</span>
                  <span className="kv-value mono">Usuario #{selectedReceipt.received_by_user_id}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Fecha de recepción (received_at)</span>
                  <span className="kv-value mono">{formatUtcDateTime(selectedReceipt.received_at)}</span>
                </div>
              </div>

              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID Línea Recepción</th>
                      <th>Línea OC (purchase_order_line_id)</th>
                      <th>Cantidad Recibida</th>
                      <th>Cantidad Aceptada</th>
                      <th>Cantidad Rechazada</th>
                      <th>Motivo de Rechazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReceipt.lines || []).map((line) => (
                      <tr key={line.receipt_line_id}>
                        <td className="mono">#{line.receipt_line_id}</td>
                        <td className="mono">Línea OC #{line.purchase_order_line_id}</td>
                        <td className="mono">{line.quantity_received}</td>
                        <td className="mono">
                          <strong>{line.quantity_accepted}</strong>
                        </td>
                        <td className="mono">{line.quantity_rejected}</td>
                        <td>{line.rejection_reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Register Receipt Form */}
      {canWrite ? (
        <section className="section-block" aria-labelledby="register-receipt-heading">
          <div className="section-header">
            <div>
              <span className="folio-num">REGISTRO EN ALMACÉN — POST /api/operations/orders/:id/receipts</span>
              <h2 id="register-receipt-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                Registrar Recepción de Orden de Compra
              </h2>
            </div>

            <div className="btn-group">
              <input
                type="number"
                min="1"
                className="form-control mono"
                style={{ width: '185px', minHeight: '38px' }}
                placeholder="ID Orden de compra..."
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                aria-label="ID de orden de compra para recibir"
              />
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleLoadOrderForReceipt(orderIdInput.trim())}
                disabled={loadingOrder}
              >
                {loadingOrder ? 'Cargando...' : 'Cargar líneas de la orden'}
              </button>
            </div>
          </div>

          <div className="section-body">
            <ErrorAlert error={createError} title="No se pudo registrar la recepción" />

            {!loadedOrder ? (
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
                Ingresa el ID de una orden en estado <code>sent</code>, <code>acknowledged</code> o <code>partially_received</code> y carga sus líneas para capturar las cantidades recibidas en almacén.
              </p>
            ) : (
              <form onSubmit={handlePrepareReceiptSubmit}>
                <div
                  className="mono"
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--grid-hairline)',
                    marginBottom: '1rem',
                    fontSize: '0.825rem',
                  }}
                >
                  Orden cargada: <strong>#{loadedOrder.purchase_order_id} ({loadedOrder.po_number})</strong> | Estado actual:{' '}
                  <strong>{loadedOrder.status}</strong> | Proveedor: <strong>#{loadedOrder.supplier_id}</strong>
                </div>

                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-field">
                    <label htmlFor="receipt-number" className="form-label">
                      Número de Recepción (receipt_number) *
                    </label>
                    <input
                      id="receipt-number"
                      type="text"
                      required
                      maxLength={40}
                      className="form-control mono"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="Ej. REC-2026-001"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="receipt-warehouse" className="form-label">
                      ID Almacén destino activo (warehouse_id) *
                    </label>
                    <input
                      id="receipt-warehouse"
                      type="number"
                      required
                      min="1"
                      step="1"
                      className="form-control mono"
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      placeholder="ID de almacén activo"
                    />
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="swiss-table">
                    <thead>
                      <tr>
                        <th>Incluir</th>
                        <th>Línea OC / Producto</th>
                        <th>Cant. Ordenada</th>
                        <th>Cant. Recibida (3 dec.) *</th>
                        <th>Cant. Aceptada (3 dec.) *</th>
                        <th>Cant. Rechazada (3 dec.) *</th>
                        <th>Motivo Rechazo (si &gt; 0)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptLinesForm.map((line) => (
                        <tr key={line.purchase_order_line_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={line.include}
                              onChange={(e) =>
                                handleReceiptLineChange(
                                  line.purchase_order_line_id,
                                  'include',
                                  e.target.checked
                                )
                              }
                              aria-label={`Incluir línea ${line.purchase_order_line_id}`}
                            />
                          </td>
                          <td className="mono">
                            Línea OC #{line.purchase_order_line_id} (Prod #{line.product_id})
                          </td>
                          <td className="mono">{line.quantity_ordered}</td>
                          <td>
                            <input
                              type="text"
                              disabled={!line.include}
                              required={line.include}
                              className="form-control mono"
                              value={line.quantity_received}
                              onChange={(e) =>
                                handleReceiptLineChange(
                                  line.purchase_order_line_id,
                                  'quantity_received',
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              disabled={!line.include}
                              required={line.include}
                              className="form-control mono"
                              value={line.quantity_accepted}
                              onChange={(e) =>
                                handleReceiptLineChange(
                                  line.purchase_order_line_id,
                                  'quantity_accepted',
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              disabled={!line.include}
                              required={line.include}
                              className="form-control mono"
                              value={line.quantity_rejected}
                              onChange={(e) =>
                                handleReceiptLineChange(
                                  line.purchase_order_line_id,
                                  'quantity_rejected',
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              disabled={!line.include}
                              className="form-control"
                              value={line.rejection_reason}
                              onChange={(e) =>
                                handleReceiptLineChange(
                                  line.purchase_order_line_id,
                                  'rejection_reason',
                                  e.target.value
                                )
                              }
                              placeholder="Requerido si hay rechazo"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="btn-group" style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={submittingReceipt}>
                    Revisar y contabilizar recepción
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {/* Receipts List */}
      <section className="section-block" aria-labelledby="receipts-list-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">COLECCIÓN — GET /api/operations/receipts</span>
            <h2 id="receipts-list-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Historial de Recepciones
            </h2>
          </div>

          <div className="btn-group">
            <select
              className="form-control"
              style={{ width: 'auto', minHeight: '38px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filtrar recepciones por estado"
            >
              <option value="">Todos los estados</option>
              <option value="posted">posted (Registrada)</option>
              <option value="draft">draft</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button type="button" className="btn btn-sm btn-secondary" onClick={loadReceipts}>
              Actualizar
            </button>
          </div>
        </div>

        <div className="section-body">
          <ErrorAlert error={listError} title="Error al listar recepciones" onRetry={loadReceipts} />

          {loadingList ? (
            <SkeletonLoader rows={3} columns={4} label="Consultando recepciones..." />
          ) : receipts.length === 0 ? (
            <EmptyState
              folio="SIN RECEPCIONES REGISTRADAS"
              title="No se encontraron recepciones para los filtros seleccionados"
              description="Las recepciones registradas por el almacén sobre órdenes enviadas se listarán en esta tabla."
            />
          ) : (
            <>
              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID / Número Recepción</th>
                      <th>Orden de Compra</th>
                      <th>Recibido por</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((rec) => (
                      <tr key={rec.receipt_id}>
                        <td className="mono">
                          <strong>#{rec.receipt_id}</strong> — {rec.receipt_number}
                        </td>
                        <td className="mono">Orden #{rec.purchase_order_id}</td>
                        <td className="mono">Usuario #{rec.received_by_user_id}</td>
                        <td className="mono">{formatUtcDateTime(rec.received_at)}</td>
                        <td>
                          <StatusBadge status={rec.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => loadReceiptDetail(rec.receipt_id)}
                          >
                            Ver líneas
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
                totalLabel="recepciones"
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

      <ConfirmModal
        isOpen={confirmReceiptOpen}
        folio="CONFIRMAR RECEPCIÓN EN ALMACÉN"
        title={`Contabilizar recepción ${receiptNumber} para Orden #${loadedOrder?.purchase_order_id}`}
        description="Esta operación creará la recepción en estado posted, actualizará el estado de la orden (partially_received o received) y registrará movimientos de entrada de inventario para los productos inventariables aceptados."
        warningNote="Las recepciones y los movimientos de inventario son permanentes y no pueden modificarse ni eliminarse mediante CRUD genérico."
        confirmLabel="Confirmar y contabilizar recepción"
        isSubmitting={submittingReceipt}
        onConfirm={handleConfirmRegisterReceipt}
        onCancel={() => setConfirmReceiptOpen(false)}
      />
    </div>
  );
}
