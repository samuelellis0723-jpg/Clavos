import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import {
  listOperationDocuments,
  getOperationDocumentDetail,
  scheduleInvoicePayment,
  confirmScheduledPayment,
} from '../services/operationsService.js';
import { formatCivilDate } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function PaymentsPage() {
  const { token, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const canFinance = hasRole('finance');

  const initialInvoiceId = searchParams.get('invoice_id') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  // Payment detail & confirmation
  const [lookupPaymentId, setLookupPaymentId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Confirm external payment modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bankReference, setBankReference] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Schedule payment form
  const [invoiceIdInput, setInvoiceIdInput] = useState(initialInvoiceId);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  const loadPayments = useCallback(async () => {
    if (!canFinance) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await listOperationDocuments('payments', token, {
        page,
        limit,
        status: statusFilter || undefined,
      });
      setPayments(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setListError(err);
    } finally {
      setLoadingList(false);
    }
  }, [canFinance, token, page, limit, statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const loadPaymentDetail = useCallback(
    async (payId) => {
      if (!payId) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await getOperationDocumentDetail('payments', payId, token);
        setSelectedPayment(res?.data || null);
      } catch (err) {
        setDetailError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    setScheduleError(null);
    setActionSuccess(null);
    setScheduling(true);

    try {
      const res = await scheduleInvoicePayment(
        invoiceIdInput.trim(),
        {
          payment_reference: paymentReference.trim(),
          payment_method: paymentMethod.trim(),
        },
        token
      );
      const created = res?.data;
      setActionSuccess(
        `Pago #${created?.payment_id} (${created?.payment_reference}) programado (estado: ${
          created?.status || 'scheduled'
        }) por ${created?.currency_code} ${created?.amount} para la factura #${invoiceIdInput}.`
      );
      setPaymentReference('');
      await loadPayments();
      if (created?.payment_id) {
        await loadPaymentDetail(created.payment_id);
      }
    } catch (err) {
      setScheduleError(err);
    } finally {
      setScheduling(false);
    }
  };

  const handleConfirmExternalPayment = async () => {
    if (!selectedPayment) return;
    if (!bankReference.trim() || !paymentDate) {
      setDetailError('Debes proporcionar la fecha real del pago (YYYY-MM-DD) y la referencia bancaria externa.');
      return;
    }
    setConfirmingPayment(true);
    setDetailError(null);
    setActionSuccess(null);

    try {
      const res = await confirmScheduledPayment(
        selectedPayment.payment_id,
        {
          payment_date: paymentDate,
          bank_reference: bankReference.trim(),
        },
        token
      );
      setConfirmModalOpen(false);
      setBankReference('');
      setActionSuccess(
        `Pago #${selectedPayment.payment_id} confirmado (${
          res?.data?.status || 'completed'
        }) con referencia bancaria "${res?.data?.bank_reference}". La factura asociada pasó a estado paid.`
      );
      await loadPayments();
      await loadPaymentDetail(selectedPayment.payment_id);
    } catch (err) {
      setConfirmModalOpen(false);
      setDetailError(err);
    } finally {
      setConfirmingPayment(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="payments-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 07 DEL CIRCUITO — /api/operations/payments</span>
          <h1 id="payments-heading" className="page-title">
            Programación y Confirmación de Pagos a Proveedores
          </h1>
          <p className="page-description">
            Programación del pago completo de una factura aprobada y confirmación posterior mediante fecha y referencia bancaria verificada.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">ADVERTENCIA OPERATIVA CRÍTICA</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
              Confirmar un pago registra una referencia de pago externo y NO transfiere dinero.
            </p>
            <p style={{ marginTop: '0.25rem', color: 'var(--ink-secondary)', fontSize: '0.82rem' }}>
              El sistema Clavos no tiene integración bancaria ni ejecuta transferencias electrónicas. El operador de finanzas solo debe confirmar un pago tras haber verificado el comprobante bancario real.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            payment_date debe estar entre invoice_date y la fecha UTC actual.
          </div>
        </div>
      </section>

      <div className="alert-banner alert-warning" role="note">
        <div className="alert-title">Alcance del registro de pagos en Clavos</div>
        <div className="alert-body">
          Tanto <code>POST /api/operations/invoices/:id/payments</code> (programar) como <code>POST /api/operations/payments/:id/confirm</code> (confirmar) son registros contables/operativos internos. <strong>Confirmar únicamente documenta la referencia bancaria (<code>bank_reference</code>) y fecha de un desembolso externo ya efectuado; no mueve fondos ni conecta con entidades financieras.</strong>
        </div>
      </div>

      {actionSuccess ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Operación de pago completada</div>
          <div className="alert-body">{actionSuccess}</div>
        </div>
      ) : null}

      {/* Payment Detail & Confirmation */}
      <section className="section-block" aria-labelledby="payment-detail-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">DETALLE DE PAGO — GET /api/operations/payments/:id</span>
            <h2 id="payment-detail-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Inspeccionar Pago y Confirmar Referencia Bancaria Externa
            </h2>
          </div>

          <form
            className="btn-group"
            onSubmit={(e) => {
              e.preventDefault();
              loadPaymentDetail(lookupPaymentId.trim());
            }}
          >
            <input
              type="number"
              min="1"
              className="form-control mono"
              style={{ width: '170px', minHeight: '38px' }}
              placeholder="ID pago..."
              value={lookupPaymentId}
              onChange={(e) => setLookupPaymentId(e.target.value)}
              aria-label="ID de pago a consultar"
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cargar pago
            </button>
          </form>
        </div>

        <div className="section-body">
          <ErrorAlert error={detailError} title="Error al consultar o confirmar el pago" />

          {loadingDetail ? (
            <SkeletonLoader rows={2} columns={3} label="Cargando detalle de pago..." />
          ) : !selectedPayment ? (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
              Selecciona un pago de la tabla inferior o ingresa su ID para ver su asignación a factura (<code>payment_allocations</code>) y confirmar su referencia bancaria externa.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="folio-num">PAGO #{selectedPayment.payment_id}</span>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedPayment.payment_reference}</h3>
                </div>
                <div className="btn-group">
                  <StatusBadge status={selectedPayment.status} />
                  {selectedPayment.status === 'scheduled' && canFinance ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setConfirmModalOpen(true)}
                    >
                      Confirmar referencia de pago externo
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Monto Total (amount)</span>
                  <span className="kv-value mono">
                    {selectedPayment.currency_code} {selectedPayment.amount}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Método (payment_method)</span>
                  <span className="kv-value mono">{selectedPayment.payment_method}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Fecha de Pago (payment_date)</span>
                  <span className="kv-value mono">{formatCivilDate(selectedPayment.payment_date)}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Referencia Bancaria (bank_reference)</span>
                  <span className="kv-value mono">{selectedPayment.bank_reference || 'Pendiente de confirmar'}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Creado por / Confirmado por</span>
                  <span className="kv-value mono">
                    #{selectedPayment.created_by_user_id || '—'} /{' '}
                    {selectedPayment.confirmed_by_user_id ? `#${selectedPayment.confirmed_by_user_id}` : '—'}
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  Asignaciones a Facturas (payment_allocations)
                </h4>
                <div className="table-scroll">
                  <table className="swiss-table">
                    <thead>
                      <tr>
                        <th>ID Asignación (payment_allocation_id)</th>
                        <th>ID Factura (invoice_id)</th>
                        <th>Monto Aplicado (amount_applied)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPayment.lines || []).map((alloc) => (
                        <tr key={alloc.payment_allocation_id}>
                          <td className="mono">#{alloc.payment_allocation_id}</td>
                          <td className="mono">Factura #{alloc.invoice_id}</td>
                          <td className="mono">
                            <strong>
                              {selectedPayment.currency_code} {alloc.amount_applied}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Schedule Payment Form */}
      {canFinance ? (
        <section className="section-block" aria-labelledby="schedule-payment-heading">
          <div className="section-header">
            <div>
              <span className="folio-num">PROGRAMACIÓN — POST /api/operations/invoices/:id/payments</span>
              <h2 id="schedule-payment-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                Programar Pago Completo de Factura Aprobada
              </h2>
            </div>
          </div>

          <form className="section-body" onSubmit={handleScheduleSubmit}>
            <ErrorAlert error={scheduleError} title="No se pudo programar el pago" />

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="pay-invoice-id" className="form-label">
                  ID Factura Aprobada (invoice_id) *
                </label>
                <input
                  id="pay-invoice-id"
                  type="number"
                  required
                  min="1"
                  step="1"
                  className="form-control mono"
                  value={invoiceIdInput}
                  onChange={(e) => setInvoiceIdInput(e.target.value)}
                  placeholder="ID de factura en estado approved"
                />
              </div>

              <div className="form-field">
                <label htmlFor="pay-reference" className="form-label">
                  Referencia Interna de Pago (payment_reference, única) *
                </label>
                <input
                  id="pay-reference"
                  type="text"
                  required
                  maxLength={100}
                  className="form-control mono"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej. PAG-2026-001"
                />
              </div>

              <div className="form-field">
                <label htmlFor="pay-method" className="form-label">
                  Método de Pago (payment_method) *
                </label>
                <select
                  id="pay-method"
                  className="form-control mono"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="transfer">transfer (Transferencia bancaria)</option>
                  <option value="check">check (Cheque)</option>
                  <option value="sinpe">sinpe (SINPE)</option>
                  <option value="wire">wire (Giros / Internacional)</option>
                </select>
              </div>
            </div>

            <div className="btn-group" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={scheduling}>
                {scheduling ? 'Programando pago...' : 'Programar pago completo (scheduled)'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Payments List */}
      <section className="section-block" aria-labelledby="payments-list-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">COLECCIÓN — GET /api/operations/payments</span>
            <h2 id="payments-list-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Historial de Pagos
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
              aria-label="Filtrar pagos por estado"
            >
              <option value="">Todos los estados</option>
              <option value="scheduled">scheduled (Programado)</option>
              <option value="completed">completed (Completado)</option>
              <option value="processing">processing</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button type="button" className="btn btn-sm btn-secondary" onClick={loadPayments}>
              Actualizar
            </button>
          </div>
        </div>

        <div className="section-body">
          <ErrorAlert error={listError} title="Error al listar pagos" onRetry={loadPayments} />

          {loadingList ? (
            <SkeletonLoader rows={3} columns={4} label="Consultando pagos..." />
          ) : payments.length === 0 ? (
            <EmptyState
              folio="SIN PAGOS REGISTRADOS"
              title="No se encontraron pagos para los criterios actuales"
              description="Los pagos programados y confirmados por finanzas se listarán en esta tabla."
            />
          ) : (
            <>
              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID / Referencia Pago</th>
                      <th>Monto / Método</th>
                      <th>Fecha Pago / Ref. Bancaria</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.payment_id}>
                        <td className="mono">
                          <strong>#{pay.payment_id}</strong> — {pay.payment_reference}
                        </td>
                        <td className="mono">
                          <strong>
                            {pay.currency_code} {pay.amount}
                          </strong>{' '}
                          ({pay.payment_method})
                        </td>
                        <td className="mono">
                          {formatCivilDate(pay.payment_date)} | {pay.bank_reference || '—'}
                        </td>
                        <td>
                          <StatusBadge status={pay.status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => loadPaymentDetail(pay.payment_id)}
                          >
                            Ver detalle / confirmar
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
                totalLabel="pagos"
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
        isOpen={confirmModalOpen}
        folio="CONFIRMAR REFERENCIA DE PAGO EXTERNO"
        title={`Confirmar pago #${selectedPayment?.payment_id} (${selectedPayment?.payment_reference})`}
        description={`Monto del pago: ${selectedPayment?.currency_code} ${selectedPayment?.amount}. Al confirmar, el pago pasará a estado completed y la factura vinculada pasará a estado paid.`}
        warningNote="IMPORTANTE: Confirmar este pago únicamente registra en la base de datos la fecha y la referencia de un pago bancario externo ya realizado. Esta acción NO ejecuta ninguna transferencia bancaria ni mueve fondos."
        confirmLabel="Confirmar registro de referencia bancaria"
        isSubmitting={confirmingPayment}
        onConfirm={handleConfirmExternalPayment}
        onCancel={() => setConfirmModalOpen(false)}
      >
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="confirm-payment-date" className="form-label">
              Fecha real del pago (payment_date, YYYY-MM-DD) *
            </label>
            <input
              id="confirm-payment-date"
              type="date"
              required
              className="form-control mono"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
            <span className="form-helper">
              No puede ser anterior a la fecha de la factura ni futura respecto a hoy UTC.
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="confirm-bank-ref" className="form-label">
              Referencia bancaria real (bank_reference) *
            </label>
            <input
              id="confirm-bank-ref"
              type="text"
              required
              maxLength={120}
              className="form-control mono"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              placeholder="Comprobante / número de transferencia real"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}
