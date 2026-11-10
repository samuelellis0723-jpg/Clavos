import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import {
  listOperationDocuments,
  getOperationDocumentDetail,
  createPurchaseOrder,
  sendPurchaseOrder,
} from '../services/operationsService.js';
import { computeLineAmountsStrings, computeDocumentTotalsStrings } from '../services/decimal.js';
import { formatUtcDateTime, formatCivilDate } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function OrdersPage() {
  const { token, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const canRead = hasRole('buyer', 'warehouse', 'finance');
  const canWrite = hasRole('buyer');

  const initialReqId = searchParams.get('requisition_id') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  // Order detail inspection
  const [lookupOrderId, setLookupOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Send order confirmation modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);

  // Create order from approved requisition
  const [reqIdInput, setReqIdInput] = useState(initialReqId);
  const [loadedReq, setLoadedReq] = useState(null);
  const [loadingReq, setLoadingReq] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [orderLinesForm, setOrderLinesForm] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!canRead) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await listOperationDocuments('orders', token, {
        page,
        limit,
        status: statusFilter || undefined,
      });
      setOrders(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setListError(err);
    } finally {
      setLoadingList(false);
    }
  }, [canRead, token, page, limit, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadOrderDetail = useCallback(
    async (orderId) => {
      if (!orderId) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await getOperationDocumentDetail('orders', orderId, token);
        setSelectedOrder(res?.data || null);
      } catch (err) {
        setDetailError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  const handleLoadRequisitionLines = useCallback(
    async (idToFetch) => {
      if (!idToFetch) return;
      setLoadingReq(true);
      setCreateError(null);
      try {
        const res = await getOperationDocumentDetail('requisitions', idToFetch, token);
        const reqData = res?.data;
        setLoadedReq(reqData || null);
        if (reqData?.lines) {
          setOrderLinesForm(
            reqData.lines.map((rl) => ({
              requisition_line_id: rl.requisition_line_id,
              product_id: rl.product_id,
              quantity_requested: rl.quantity_requested,
              estimated_unit_price: rl.estimated_unit_price,
              supplier_product_id: '',
              unit_price: rl.estimated_unit_price || '',
              tax_rate: '0.1300',
            }))
          );
        }
      } catch (err) {
        setCreateError(err);
      } finally {
        setLoadingReq(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (initialReqId && canWrite) {
      handleLoadRequisitionLines(initialReqId);
    }
  }, [initialReqId, canWrite, handleLoadRequisitionLines]);

  const handleOrderLineChange = (reqLineId, field, value) => {
    setOrderLinesForm((prev) =>
      prev.map((item) =>
        item.requisition_line_id === reqLineId ? { ...item, [field]: value } : item
      )
    );
  };

  const previewOrderTotals = useMemo(() => {
    return computeDocumentTotalsStrings(
      orderLinesForm.map((l) => ({
        quantity_ordered: l.quantity_requested,
        unit_price: l.unit_price,
        tax_rate: l.tax_rate,
      }))
    );
  }, [orderLinesForm]);

  const handleCreateOrderSubmit = async (event) => {
    event.preventDefault();
    if (!loadedReq) return;
    setCreateError(null);
    setActionSuccess(null);
    setCreatingOrder(true);

    try {
      const payload = {
        po_number: poNumber.trim(),
        supplier_id: Number(supplierId),
        ...(expectedDeliveryDate ? { expected_delivery_date: expectedDeliveryDate } : {}),
        lines: orderLinesForm.map((l) => ({
          requisition_line_id: Number(l.requisition_line_id),
          supplier_product_id: Number(l.supplier_product_id),
          unit_price: String(l.unit_price).trim(),
          tax_rate: String(l.tax_rate).trim(),
        })),
      };

      const res = await createPurchaseOrder(loadedReq.requisition_id, payload, token);
      const created = res?.data;
      setActionSuccess(
        `Orden de compra #${created?.purchase_order_id} (${created?.po_number}) creada en estado draft con total ${created?.currency_code} ${created?.total_amount}. La requisición #${loadedReq.requisition_id} pasó a estado ordered.`
      );
      setPoNumber('');
      await loadOrders();
      if (created?.purchase_order_id) {
        await loadOrderDetail(created.purchase_order_id);
      }
    } catch (err) {
      setCreateError(err);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleConfirmSendOrder = async () => {
    if (!selectedOrder) return;
    setSendingOrder(true);
    setDetailError(null);
    setActionSuccess(null);
    try {
      const res = await sendPurchaseOrder(selectedOrder.purchase_order_id, token);
      setSendModalOpen(false);
      setActionSuccess(
        `Orden #${selectedOrder.purchase_order_id} marcada como enviada (${res?.data?.status || 'sent'}). Ya está habilitada para recepción en almacén.`
      );
      await loadOrders();
      await loadOrderDetail(selectedOrder.purchase_order_id);
    } catch (err) {
      setSendModalOpen(false);
      setDetailError(err);
    } finally {
      setSendingOrder(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="orders-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 03 DEL CIRCUITO — /api/operations/orders</span>
          <h1 id="orders-heading" className="page-title">
            Órdenes de Compra y Envío Operativo
          </h1>
          <p className="page-description">
            Emisión de órdenes de compra a partir de requisiciones aprobadas y registro de envío al proveedor.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">REGLAS DEL CIRCUITO INICIAL</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              Cada requisición <code>approved</code> genera una única orden con todas sus líneas en un solo proveedor. El total con impuestos (<code>subtotal + tax_total</code>) no puede superar el presupuesto aprobado (<code>409 APPROVED_BUDGET_EXCEEDED</code>). El producto equivalente debe tener la misma moneda, unidad base y <code>pack_quantity = 1.000</code>.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            tax_rate se expresa como fracción (ej. 0.1300 = 13 %)
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Operación de orden completada</div>
          <div className="alert-body">{actionSuccess}</div>
        </div>
      ) : null}

      {/* Order Detail & Send */}
      <section className="section-block" aria-labelledby="order-detail-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">DETALLE DE ORDEN — GET /api/operations/orders/:id</span>
            <h2 id="order-detail-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Inspeccionar Orden de Compra y Líneas
            </h2>
          </div>

          <form
            className="btn-group"
            onSubmit={(e) => {
              e.preventDefault();
              loadOrderDetail(lookupOrderId.trim());
            }}
          >
            <input
              type="number"
              min="1"
              className="form-control mono"
              style={{ width: '170px', minHeight: '38px' }}
              placeholder="ID orden..."
              value={lookupOrderId}
              onChange={(e) => setLookupOrderId(e.target.value)}
              aria-label="ID de orden a consultar"
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cargar orden
            </button>
          </form>
        </div>

        <div className="section-body">
          <ErrorAlert error={detailError} title="Error al consultar o enviar la orden" />

          {loadingDetail ? (
            <SkeletonLoader rows={2} columns={3} label="Cargando orden de compra..." />
          ) : !selectedOrder ? (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
              Selecciona una orden de la lista inferior o busca por su ID para revisar sus montos, líneas (<code>purchase_order_lines</code>) y pasarla a recepción o facturación.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="folio-num">ORDEN DE COMPRA #{selectedOrder.purchase_order_id}</span>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedOrder.po_number}</h3>
                </div>
                <div className="btn-group">
                  <StatusBadge status={selectedOrder.status} />
                  {selectedOrder.status === 'draft' && canWrite ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setSendModalOpen(true)}
                    >
                      Marcar orden como enviada (send)
                    </button>
                  ) : null}
                  {['sent', 'acknowledged', 'partially_received'].includes(selectedOrder.status) &&
                  hasRole('warehouse') ? (
                    <Link
                      to={`/app/receipts?order_id=${selectedOrder.purchase_order_id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Registrar recepción en almacén
                    </Link>
                  ) : null}
                  {selectedOrder.status === 'received' && hasRole('finance') ? (
                    <Link
                      to={`/app/invoices?order_id=${selectedOrder.purchase_order_id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Registrar factura conciliada
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Requisición origen</span>
                  <span className="kv-value mono">#{selectedOrder.requisition_id}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Proveedor (supplier_id)</span>
                  <span className="kv-value mono">#{selectedOrder.supplier_id}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Subtotal</span>
                  <span className="kv-value mono">
                    {selectedOrder.currency_code} {selectedOrder.subtotal}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Impuestos (tax_total)</span>
                  <span className="kv-value mono">
                    {selectedOrder.currency_code} {selectedOrder.tax_total}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Total Orden (total_amount)</span>
                  <span className="kv-value mono">
                    {selectedOrder.currency_code} {selectedOrder.total_amount}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Entrega esperada / Fecha envío</span>
                  <span className="kv-value mono">
                    {formatCivilDate(selectedOrder.expected_delivery_date)} /{' '}
                    {formatUtcDateTime(selectedOrder.ordered_at)}
                  </span>
                </div>
              </div>

              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID Línea OC (purchase_order_line_id)</th>
                      <th>Producto / Categoría / Unidad</th>
                      <th>Equivalente (supplier_product_id)</th>
                      <th>Cantidad ordenada</th>
                      <th>Precio unitario</th>
                      <th>Tasa impuesto (tax_rate)</th>
                      <th>Total línea (line_total)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.lines || []).map((line) => (
                      <tr key={line.purchase_order_line_id}>
                        <td className="mono">
                          <strong>#{line.purchase_order_line_id}</strong>
                        </td>
                        <td className="mono">
                          Prod #{line.product_id} | Cat #{line.category_id} | Unid #{line.unit_id}
                        </td>
                        <td className="mono">#{line.supplier_product_id}</td>
                        <td className="mono">{line.quantity_ordered}</td>
                        <td className="mono">{line.unit_price}</td>
                        <td className="mono">{line.tax_rate}</td>
                        <td className="mono">
                          <strong>{line.line_total}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create Order Form (Buyer / Admin) */}
      {canWrite ? (
        <section className="section-block" aria-labelledby="create-order-heading">
          <div className="section-header">
            <div>
              <span className="folio-num">EMISIÓN DE ORDEN — POST /api/operations/requisitions/:id/orders</span>
              <h2 id="create-order-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                Crear Orden de Compra desde Requisición Aprobada
              </h2>
            </div>

            <div className="btn-group">
              <input
                type="number"
                min="1"
                className="form-control mono"
                style={{ width: '190px', minHeight: '38px' }}
                placeholder="ID Requisición aprobada"
                value={reqIdInput}
                onChange={(e) => setReqIdInput(e.target.value)}
                aria-label="ID de requisición aprobada"
              />
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleLoadRequisitionLines(reqIdInput.trim())}
                disabled={loadingReq}
              >
                {loadingReq ? 'Cargando...' : 'Cargar líneas de requisición'}
              </button>
            </div>
          </div>

          <div className="section-body">
            <ErrorAlert error={createError} title="No se pudo generar la orden de compra" />

            {!loadedReq ? (
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
                Ingresa el ID de una requisición en estado <code>approved</code> y pulsa &ldquo;Cargar líneas de requisición&rdquo; para preparar la orden completa con todas sus líneas.
              </p>
            ) : (
              <form onSubmit={handleCreateOrderSubmit}>
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
                  Requisición cargada: <strong>#{loadedReq.requisition_id} ({loadedReq.requisition_number})</strong> | Estado:{' '}
                  <strong>{loadedReq.status}</strong> | Presupuesto máximo autorizado (con impuestos):{' '}
                  <strong>
                    {loadedReq.currency_code} {loadedReq.estimated_total}
                  </strong>
                </div>

                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-field">
                    <label htmlFor="po-number" className="form-label">
                      Número de Orden (po_number) *
                    </label>
                    <input
                      id="po-number"
                      type="text"
                      required
                      maxLength={40}
                      className="form-control mono"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Ej. OC-2026-001"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="po-supplier-id" className="form-label">
                      ID Proveedor único (supplier_id) *
                    </label>
                    <input
                      id="po-supplier-id"
                      type="number"
                      required
                      min="1"
                      step="1"
                      className="form-control mono"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      placeholder="ID del proveedor activo"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="po-expected-date" className="form-label">
                      Fecha esperada de entrega (expected_delivery_date)
                    </label>
                    <input
                      id="po-expected-date"
                      type="date"
                      className="form-control mono"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="swiss-table">
                    <thead>
                      <tr>
                        <th>Línea Req (requisition_line_id)</th>
                        <th>Producto / Cant. solicitada</th>
                        <th>ID Equivalente Proveedor (supplier_product_id) *</th>
                        <th>Precio unitario (4 decimales) *</th>
                        <th>Fracción Impuesto (tax_rate, 4 dec.) *</th>
                        <th>Subtotal + Impuesto = Total línea</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLinesForm.map((line) => {
                        const calc = computeLineAmountsStrings(
                          line.quantity_requested,
                          line.unit_price,
                          line.tax_rate
                        );
                        return (
                          <tr key={line.requisition_line_id}>
                            <td className="mono">#{line.requisition_line_id}</td>
                            <td className="mono">
                              Prod #{line.product_id} | Cant: <strong>{line.quantity_requested}</strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)' }}>
                                Est. req: {line.estimated_unit_price}
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                required
                                min="1"
                                step="1"
                                className="form-control mono"
                                value={line.supplier_product_id}
                                onChange={(e) =>
                                  handleOrderLineChange(
                                    line.requisition_line_id,
                                    'supplier_product_id',
                                    e.target.value
                                  )
                                }
                                placeholder="ID supplier_product"
                                aria-label={`ID producto equivalente para línea ${line.requisition_line_id}`}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                className="form-control mono"
                                value={line.unit_price}
                                onChange={(e) =>
                                  handleOrderLineChange(
                                    line.requisition_line_id,
                                    'unit_price',
                                    e.target.value
                                  )
                                }
                                placeholder="100.0000"
                                aria-label={`Precio unitario para línea ${line.requisition_line_id}`}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                className="form-control mono"
                                value={line.tax_rate}
                                onChange={(e) =>
                                  handleOrderLineChange(
                                    line.requisition_line_id,
                                    'tax_rate',
                                    e.target.value
                                  )
                                }
                                placeholder="0.1300"
                                aria-label={`Tasa de impuesto para línea ${line.requisition_line_id}`}
                              />
                            </td>
                            <td className="mono">
                              {calc.valid ? (
                                <div>
                                  <div>Sub: {calc.subtotal} | IVA: {calc.tax}</div>
                                  <strong>Total: {calc.total}</strong>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--status-danger-text)' }}>{calc.error}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  className="mono"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--grid-hairline)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span>Previsualización exacta de Orden (BigInt):</span>
                  {previewOrderTotals.valid ? (
                    <span>
                      Subtotal: <strong>{previewOrderTotals.subtotal}</strong> + Impuestos:{' '}
                      <strong>{previewOrderTotals.tax_total}</strong> = Total:{' '}
                      <strong>
                        {loadedReq.currency_code} {previewOrderTotals.total_amount}
                      </strong>{' '}
                      (Presupuesto máx: {loadedReq.estimated_total})
                    </span>
                  ) : (
                    <span style={{ color: 'var(--status-danger-text)' }}>{previewOrderTotals.error}</span>
                  )}
                </div>

                <div className="btn-group" style={{ marginTop: '1rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingOrder || loadedReq.status !== 'approved'}
                  >
                    {creatingOrder ? 'Emitiendo orden...' : 'Emitir Orden de Compra (POST)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {/* Orders List */}
      <section className="section-block" aria-labelledby="orders-list-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">COLECCIÓN — GET /api/operations/orders</span>
            <h2 id="orders-list-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Órdenes de Compra Registradas
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
              aria-label="Filtrar órdenes por estado"
            >
              <option value="">Todos los estados</option>
              <option value="draft">draft (Borrador)</option>
              <option value="sent">sent (Enviada)</option>
              <option value="acknowledged">acknowledged</option>
              <option value="partially_received">partially_received</option>
              <option value="received">received (Recibida completa)</option>
            </select>
            <button type="button" className="btn btn-sm btn-secondary" onClick={loadOrders}>
              Actualizar
            </button>
          </div>
        </div>

        <div className="section-body">
          <ErrorAlert error={listError} title="Error al listar órdenes de compra" onRetry={loadOrders} />

          {loadingList ? (
            <SkeletonLoader rows={3} columns={4} label="Consultando órdenes de compra..." />
          ) : orders.length === 0 ? (
            <EmptyState
              folio="SIN ÓRDENES DE COMPRA"
              title="No se encontraron órdenes de compra registradas"
              description="Cuando un comprador emita una orden desde una requisición aprobada, aparecerá en este listado."
            />
          ) : (
            <>
              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID / Número OC</th>
                      <th>Requisición / Proveedor</th>
                      <th>Subtotal / Impuesto / Total</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.purchase_order_id}>
                        <td className="mono">
                          <strong>#{ord.purchase_order_id}</strong> — {ord.po_number}
                        </td>
                        <td className="mono">
                          Req #{ord.requisition_id} | Prov #{ord.supplier_id}
                        </td>
                        <td className="mono">
                          {ord.currency_code} {ord.subtotal} + {ord.tax_total} ={' '}
                          <strong>{ord.total_amount}</strong>
                        </td>
                        <td>
                          <StatusBadge status={ord.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => loadOrderDetail(ord.purchase_order_id)}
                          >
                            Ver detalle / enviar
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
                totalLabel="órdenes de compra"
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
        isOpen={sendModalOpen}
        folio="CONFIRMAR ENVÍO DE ORDEN"
        title={`Marcar orden #${selectedOrder?.purchase_order_id} (${selectedOrder?.po_number}) como enviada`}
        description="Esta operación cambiará el estado de la orden de draft a sent y registrará la marca de tiempo ordered_at."
        warningNote="De acuerdo con las decisiones de negocio del backend, marcar el envío registra la acción operativa interna en MySQL, pero NO envía correos electrónicos ni transmite pedidos automáticos al sistema del proveedor."
        confirmLabel="Confirmar envío (sent)"
        isSubmitting={sendingOrder}
        onConfirm={handleConfirmSendOrder}
        onCancel={() => setSendModalOpen(false)}
      />
    </div>
  );
}
