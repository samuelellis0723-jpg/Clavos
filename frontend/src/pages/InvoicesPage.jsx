import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import {
  listOperationDocuments,
  getOperationDocumentDetail,
  registerOrderInvoice,
  approveSupplierInvoice,
} from '../services/operationsService.js';
import { computeLineAmountsStrings, computeDocumentTotalsStrings } from '../services/decimal.js';
import { formatCivilDate, formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function InvoicesPage() {
  const { token, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const canFinance = hasRole('finance');

  const initialOrderId = searchParams.get('order_id') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  // Invoice detail & approval
  const [lookupInvoiceId, setLookupInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingInvoice, setApprovingInvoice] = useState(false);

  // Register invoice form from received order
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [loadedOrder, setLoadedOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [subtotalInput, setSubtotalInput] = useState('');
  const [taxTotalInput, setTaxTotalInput] = useState('');
  const [totalAmountInput, setTotalAmountInput] = useState('');
  const [invoiceLinesForm, setInvoiceLinesForm] = useState([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadInvoices = useCallback(async () => {
    if (!canFinance) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await listOperationDocuments('invoices', token, {
        page,
        limit,
        status: statusFilter || undefined,
      });
      setInvoices(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setListError(err);
    } finally {
      setLoadingList(false);
    }
  }, [canFinance, token, page, limit, statusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const loadInvoiceDetail = useCallback(
    async (invId) => {
      if (!invId) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await getOperationDocumentDetail('invoices', invId, token);
        setSelectedInvoice(res?.data || null);
      } catch (err) {
        setDetailError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  const handleLoadOrderForInvoice = useCallback(
    async (ordId) => {
      if (!ordId) return;
      setLoadingOrder(true);
      setCreateError(null);
      try {
        const res = await getOperationDocumentDetail('orders', ordId, token);
        const ord = res?.data;
        setLoadedOrder(ord || null);
        if (ord) {
          // Keep exact decimal strings from the order as initial values without converting to Number
          setSubtotalInput(String(ord.subtotal || ''));
          setTaxTotalInput(String(ord.tax_total || ''));
          setTotalAmountInput(String(ord.total_amount || ''));
          setInvoiceLinesForm(
            (ord.lines || []).map((pol) => ({
              purchase_order_line_id: pol.purchase_order_line_id,
              product_id: pol.product_id,
              quantity_invoiced: String(pol.quantity_ordered),
              unit_price: String(pol.unit_price),
              tax_rate: String(pol.tax_rate),
              po_line_total: String(pol.line_total),
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
    if (initialOrderId && canFinance) {
      handleLoadOrderForInvoice(initialOrderId);
    }
  }, [initialOrderId, canFinance, handleLoadOrderForInvoice]);

  const handleInvoiceLineChange = (poLineId, field, value) => {
    setInvoiceLinesForm((prev) =>
      prev.map((item) =>
        item.purchase_order_line_id === poLineId ? { ...item, [field]: value } : item
      )
    );
  };

  // Exact BigInt calculation for comparison (never using Number for money)
  const computedLinesTotals = useMemo(() => {
    return computeDocumentTotalsStrings(
      invoiceLinesForm.map((l) => ({
        quantity_invoiced: l.quantity_invoiced,
        unit_price: l.unit_price,
        tax_rate: l.tax_rate,
      }))
    );
  }, [invoiceLinesForm]);

  const handleApplyComputedTotals = () => {
    if (computedLinesTotals.valid) {
      setSubtotalInput(computedLinesTotals.subtotal);
      setTaxTotalInput(computedLinesTotals.tax_total);
      setTotalAmountInput(computedLinesTotals.total_amount);
    }
  };

  const handleCreateInvoiceSubmit = async (event) => {
    event.preventDefault();
    if (!loadedOrder) return;
    setCreateError(null);
    setActionSuccess(null);
    setCreatingInvoice(true);

    try {
      const payload = {
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        ...(dueDate ? { due_date: dueDate } : {}),
        subtotal: String(subtotalInput).trim(),
        tax_total: String(taxTotalInput).trim(),
        total_amount: String(totalAmountInput).trim(),
        lines: invoiceLinesForm.map((l) => ({
          purchase_order_line_id: Number(l.purchase_order_line_id),
          quantity_invoiced: String(l.quantity_invoiced).trim(),
          unit_price: String(l.unit_price).trim(),
          tax_rate: String(l.tax_rate).trim(),
        })),
      };

      const res = await registerOrderInvoice(loadedOrder.purchase_order_id, payload, token);
      const created = res?.data;
      setActionSuccess(
        `Factura #${created?.invoice_id} (${created?.invoice_number}) registrada y conciliada (estado: ${
          created?.status || 'matched'
        }) por ${created?.currency_code} ${created?.total_amount}.`
      );
      setInvoiceNumber('');
      await loadInvoices();
      if (created?.invoice_id) {
        await loadInvoiceDetail(created.invoice_id);
      }
    } catch (err) {
      setCreateError(err);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleConfirmApproveInvoice = async () => {
    if (!selectedInvoice) return;
    setApprovingInvoice(true);
    setDetailError(null);
    setActionSuccess(null);

    try {
      const res = await approveSupplierInvoice(selectedInvoice.invoice_id, token);
      setApproveModalOpen(false);
      setActionSuccess(
        `Factura #${selectedInvoice.invoice_id} aprobada (${res?.data?.status || 'approved'}). Ya puede programarse su pago.`
      );
      await loadInvoices();
      await loadInvoiceDetail(selectedInvoice.invoice_id);
    } catch (err) {
      setApproveModalOpen(false);
      setDetailError(err);
    } finally {
      setApprovingInvoice(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="invoices-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 06 DEL CIRCUITO — /api/operations/invoices</span>
          <h1 id="invoices-heading" className="page-title">
            Facturas de Proveedor, Conciliación Triple y Aprobación
          </h1>
          <p className="page-description">
            Registro de la factura comercial real tras la recepción completa de la orden (<code>received</code>), validación exacta de montos y líneas mediante cadenas decimales y aprobación para pago.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">REGLA DE CONCILIACIÓN ESTRICTA</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              El circuito inicial exige coincidencia exacta (sin tolerancia) entre la factura, la orden y las recepciones aceptadas (<code>409 INVOICE_AMOUNT_MISMATCH</code> / <code>409 INVOICE_LINE_MISMATCH</code>). Los montos se transmiten como cadenas decimales exactas sin reconvertirlos a coma flotante.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            Estados: matched → approved → paid
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Operación de facturación completada</div>
          <div className="alert-body">{actionSuccess}</div>
        </div>
      ) : null}

      {/* Invoice Detail & Approval */}
      <section className="section-block" aria-labelledby="invoice-detail-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">DETALLE DE FACTURA — GET /api/operations/invoices/:id</span>
            <h2 id="invoice-detail-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Inspeccionar Factura Conciliada y Aprobar
            </h2>
          </div>

          <form
            className="btn-group"
            onSubmit={(e) => {
              e.preventDefault();
              loadInvoiceDetail(lookupInvoiceId.trim());
            }}
          >
            <input
              type="number"
              min="1"
              className="form-control mono"
              style={{ width: '170px', minHeight: '38px' }}
              placeholder="ID factura..."
              value={lookupInvoiceId}
              onChange={(e) => setLookupInvoiceId(e.target.value)}
              aria-label="ID de factura a consultar"
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cargar factura
            </button>
          </form>
        </div>

        <div className="section-body">
          <ErrorAlert error={detailError} title="Error al consultar o aprobar la factura" />

          {loadingDetail ? (
            <SkeletonLoader rows={2} columns={3} label="Cargando factura..." />
          ) : !selectedInvoice ? (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
              Selecciona una factura de la lista inferior o busca por su ID para revisar sus líneas (<code>invoice_lines</code>) y aprobarla o programar su pago.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="folio-num">FACTURA DE PROVEEDOR #{selectedInvoice.invoice_id}</span>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedInvoice.invoice_number}</h3>
                </div>
                <div className="btn-group">
                  <StatusBadge status={selectedInvoice.status} />
                  {selectedInvoice.status === 'matched' && canFinance ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setApproveModalOpen(true)}
                    >
                      Aprobar factura (POST /approve)
                    </button>
                  ) : null}
                  {selectedInvoice.status === 'approved' && canFinance ? (
                    <Link
                      to={`/app/payments?invoice_id=${selectedInvoice.invoice_id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Programar pago para esta factura
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Orden / Proveedor</span>
                  <span className="kv-value mono">
                    OC #{selectedInvoice.purchase_order_id} / Prov #{selectedInvoice.supplier_id}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Fecha Factura / Vencimiento</span>
                  <span className="kv-value mono">
                    {formatCivilDate(selectedInvoice.invoice_date)} / {formatCivilDate(selectedInvoice.due_date)}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Subtotal / Impuestos</span>
                  <span className="kv-value mono">
                    {selectedInvoice.currency_code} {selectedInvoice.subtotal} + {selectedInvoice.tax_total}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Total Factura (total_amount)</span>
                  <span className="kv-value mono">
                    {selectedInvoice.currency_code} {selectedInvoice.total_amount}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Revisada por / Recibida</span>
                  <span className="kv-value mono">
                    {selectedInvoice.reviewed_by_user_id ? `#${selectedInvoice.reviewed_by_user_id}` : '—'} /{' '}
                    {formatUtcDateTime(selectedInvoice.received_at)}
                  </span>
                </div>
              </div>

              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID Línea Factura</th>
                      <th>Línea OC</th>
                      <th>Producto / Descripción</th>
                      <th>Cantidad Facturada</th>
                      <th>Precio Unitario</th>
                      <th>Tasa Impuesto</th>
                      <th>Total Línea</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.lines || []).map((line) => (
                      <tr key={line.invoice_line_id}>
                        <td className="mono">#{line.invoice_line_id}</td>
                        <td className="mono">#{line.purchase_order_line_id}</td>
                        <td>
                          <span className="mono">Prod #{line.product_id}</span> — {line.description}
                        </td>
                        <td className="mono">{line.quantity_invoiced}</td>
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

      {/* Register Invoice Form */}
      {canFinance ? (
        <section className="section-block" aria-labelledby="register-invoice-heading">
          <div className="section-header">
            <div>
              <span className="folio-num">CONCILIACIÓN — POST /api/operations/orders/:id/invoices</span>
              <h2 id="register-invoice-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                Registrar Factura Real sobre Orden Recibida
              </h2>
            </div>

            <div className="btn-group">
              <input
                type="number"
                min="1"
                className="form-control mono"
                style={{ width: '185px', minHeight: '38px' }}
                placeholder="ID Orden recibida..."
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                aria-label="ID de orden recibida para facturar"
              />
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleLoadOrderForInvoice(orderIdInput.trim())}
                disabled={loadingOrder}
              >
                {loadingOrder ? 'Cargando...' : 'Cargar orden recibida'}
              </button>
            </div>
          </div>

          <div className="section-body">
            <ErrorAlert error={createError} title="No se pudo registrar la factura" />

            {!loadedOrder ? (
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
                Ingresa el ID de una orden de compra en estado <code>received</code> para cargar sus líneas y contrastar los importes exactos de la factura real del proveedor.
              </p>
            ) : (
              <form onSubmit={handleCreateInvoiceSubmit}>
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
                  Orden cargada: <strong>#{loadedOrder.purchase_order_id} ({loadedOrder.po_number})</strong> | Estado:{' '}
                  <strong>{loadedOrder.status}</strong> | Valores OC: Subtotal{' '}
                  <strong>{loadedOrder.subtotal}</strong> + IVA <strong>{loadedOrder.tax_total}</strong> = Total{' '}
                  <strong>
                    {loadedOrder.currency_code} {loadedOrder.total_amount}
                  </strong>
                </div>

                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-field">
                    <label htmlFor="inv-number" className="form-label">
                      Número de Factura (invoice_number) *
                    </label>
                    <input
                      id="inv-number"
                      type="text"
                      required
                      maxLength={100}
                      className="form-control mono"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Ej. FAC-PROV-001"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="inv-date" className="form-label">
                      Fecha de Factura (invoice_date, YYYY-MM-DD) *
                    </label>
                    <input
                      id="inv-date"
                      type="date"
                      required
                      className="form-control mono"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="inv-due-date" className="form-label">
                      Fecha de Vencimiento (due_date, opcional)
                    </label>
                    <input
                      id="inv-due-date"
                      type="date"
                      className="form-control mono"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="inv-subtotal" className="form-label">
                      Subtotal Factura (cadena decimal exacta) *
                    </label>
                    <input
                      id="inv-subtotal"
                      type="text"
                      required
                      className="form-control mono"
                      value={subtotalInput}
                      onChange={(e) => setSubtotalInput(e.target.value)}
                      placeholder="200.00"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="inv-tax" className="form-label">
                      Impuesto Total (tax_total, cadena decimal) *
                    </label>
                    <input
                      id="inv-tax"
                      type="text"
                      required
                      className="form-control mono"
                      value={taxTotalInput}
                      onChange={(e) => setTaxTotalInput(e.target.value)}
                      placeholder="26.00"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="inv-total" className="form-label">
                      Total Factura (total_amount, cadena decimal) *
                    </label>
                    <input
                      id="inv-total"
                      type="text"
                      required
                      className="form-control mono"
                      value={totalAmountInput}
                      onChange={(e) => setTotalAmountInput(e.target.value)}
                      placeholder="226.00"
                    />
                  </div>
                </div>

                <div className="table-scroll">
                  <table className="swiss-table">
                    <thead>
                      <tr>
                        <th>Línea OC (purchase_order_line_id)</th>
                        <th>Cantidad Facturada (3 dec.) *</th>
                        <th>Precio Unitario (4 dec.) *</th>
                        <th>Tasa Impuesto (4 dec.) *</th>
                        <th>Cálculo Exacto BigInt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceLinesForm.map((line) => {
                        const calc = computeLineAmountsStrings(
                          line.quantity_invoiced,
                          line.unit_price,
                          line.tax_rate
                        );
                        return (
                          <tr key={line.purchase_order_line_id}>
                            <td className="mono">
                              #{line.purchase_order_line_id} (Prod #{line.product_id})
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                className="form-control mono"
                                value={line.quantity_invoiced}
                                onChange={(e) =>
                                  handleInvoiceLineChange(
                                    line.purchase_order_line_id,
                                    'quantity_invoiced',
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                className="form-control mono"
                                value={line.unit_price}
                                onChange={(e) =>
                                  handleInvoiceLineChange(
                                    line.purchase_order_line_id,
                                    'unit_price',
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                required
                                className="form-control mono"
                                value={line.tax_rate}
                                onChange={(e) =>
                                  handleInvoiceLineChange(
                                    line.purchase_order_line_id,
                                    'tax_rate',
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td className="mono">
                              {calc.valid ? (
                                <span>
                                  Sub: {calc.subtotal} | IVA: {calc.tax} | <strong>Total: {calc.total}</strong>
                                </span>
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
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    Suma BigInt de líneas:{' '}
                    {computedLinesTotals.valid ? (
                      <strong>
                        Subtotal {computedLinesTotals.subtotal} + IVA {computedLinesTotals.tax_total} ={' '}
                        {computedLinesTotals.total_amount}
                      </strong>
                    ) : (
                      <span>{computedLinesTotals.error}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleApplyComputedTotals}
                    disabled={!computedLinesTotals.valid}
                  >
                    Copiar suma BigInt al encabezado
                  </button>
                </div>

                <div className="btn-group" style={{ marginTop: '1rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingInvoice || loadedOrder.status !== 'received'}
                  >
                    {creatingInvoice ? 'Registrando factura...' : 'Registrar factura conciliada (POST)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {/* Invoices List */}
      <section className="section-block" aria-labelledby="invoices-list-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">COLECCIÓN — GET /api/operations/invoices</span>
            <h2 id="invoices-list-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Facturas de Proveedor Registradas
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
              aria-label="Filtrar facturas por estado"
            >
              <option value="">Todos los estados</option>
              <option value="matched">matched (Conciliada)</option>
              <option value="approved">approved (Aprobada)</option>
              <option value="paid">paid (Pagada)</option>
              <option value="partially_paid">partially_paid</option>
              <option value="disputed">disputed</option>
            </select>
            <button type="button" className="btn btn-sm btn-secondary" onClick={loadInvoices}>
              Actualizar
            </button>
          </div>
        </div>

        <div className="section-body">
          <ErrorAlert error={listError} title="Error al listar facturas" onRetry={loadInvoices} />

          {loadingList ? (
            <SkeletonLoader rows={3} columns={4} label="Consultando facturas..." />
          ) : invoices.length === 0 ? (
            <EmptyState
              folio="SIN FACTURAS REGISTRADAS"
              title="No se encontraron facturas de proveedor"
              description="Cuando finanzas registre una factura conciliada contra una orden recibida, aparecerá en este listado."
            />
          ) : (
            <>
              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID / Número Factura</th>
                      <th>Orden / Proveedor</th>
                      <th>Fecha Factura</th>
                      <th>Subtotal / Impuesto / Total</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.invoice_id}>
                        <td className="mono">
                          <strong>#{inv.invoice_id}</strong> — {inv.invoice_number}
                        </td>
                        <td className="mono">
                          OC #{inv.purchase_order_id} | Prov #{inv.supplier_id}
                        </td>
                        <td className="mono">{formatCivilDate(inv.invoice_date)}</td>
                        <td className="mono">
                          {inv.currency_code} {inv.subtotal} + {inv.tax_total} ={' '}
                          <strong>{inv.total_amount}</strong>
                        </td>
                        <td>
                          <StatusBadge status={inv.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => loadInvoiceDetail(inv.invoice_id)}
                          >
                            Ver detalle / aprobar
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
                totalLabel="facturas"
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
        isOpen={approveModalOpen}
        folio="CONFIRMAR APROBACIÓN FINANCIERA"
        title={`Aprobar factura #${selectedInvoice?.invoice_id} (${selectedInvoice?.invoice_number})`}
        description={`La factura cambiará de estado matched a approved por un monto total de ${selectedInvoice?.currency_code} ${selectedInvoice?.total_amount}, habilitando la programación de su pago.`}
        warningNote="Una factura aprobada entra en la base de cálculo del análisis de gasto (GET /api/operations/analytics/spend) y no puede revertirse por CRUD."
        confirmLabel="Confirmar aprobación de factura"
        isSubmitting={approvingInvoice}
        onConfirm={handleConfirmApproveInvoice}
        onCancel={() => setApproveModalOpen(false)}
      />
    </div>
  );
}
