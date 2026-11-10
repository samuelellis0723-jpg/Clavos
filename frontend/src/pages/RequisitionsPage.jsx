import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import {
  listOperationDocuments,
  getOperationDocumentDetail,
  createRequisition,
  submitRequisition,
} from '../services/operationsService.js';
import { computeLineAmountsStrings, computeDocumentTotalsStrings } from '../services/decimal.js';
import { formatUtcDateTime, formatCivilDate } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function RequisitionsPage() {
  const { token, user, hasRole } = useAuth();
  const canList = hasRole('requester', 'buyer', 'warehouse');
  const canCreate = hasRole('requester', 'buyer');

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [requisitions, setRequisitions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  // Detail inspection
  const [lookupId, setLookupId] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Submit confirmation modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Create form state
  const [reqNumber, setReqNumber] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('CRC');
  const [neededByDate, setNeededByDate] = useState('');
  const [justification, setJustification] = useState('');
  const [lines, setLines] = useState([
    { key: 'line-1', product_id: '', quantity_requested: '1.000', estimated_unit_price: '' },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const loadList = useCallback(async () => {
    if (!canList) return;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await listOperationDocuments('requisitions', token, {
        page,
        limit,
        status: statusFilter || undefined,
      });
      setRequisitions(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setListError(err);
    } finally {
      setLoadingList(false);
    }
  }, [canList, token, page, limit, statusFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadDetailById = useCallback(
    async (idToLoad) => {
      if (!idToLoad) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await getOperationDocumentDetail('requisitions', idToLoad, token);
        setSelectedReq(res?.data || null);
      } catch (err) {
        setDetailError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        key: `line-${Date.now()}-${prev.length + 1}`,
        product_id: '',
        quantity_requested: '1.000',
        estimated_unit_price: '',
      },
    ]);
  };

  const handleRemoveLine = (keyToRemove) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== keyToRemove) : prev));
  };

  const handleLineChange = (key, field, value) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  };

  const previewTotals = useMemo(() => {
    return computeDocumentTotalsStrings(
      lines.map((l) => ({
        quantity_requested: l.quantity_requested,
        estimated_unit_price: l.estimated_unit_price,
        tax_rate: '0.0000',
      }))
    );
  }, [lines]);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateError(null);
    setActionSuccess(null);
    setCreating(true);

    try {
      const payload = {
        requisition_number: reqNumber.trim(),
        cost_center_id: Number(costCenterId),
        currency_code: currencyCode.trim().toUpperCase(),
        business_justification: justification.trim(),
        ...(neededByDate ? { needed_by_date: neededByDate } : {}),
        lines: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity_requested: String(l.quantity_requested).trim(),
          estimated_unit_price: String(l.estimated_unit_price).trim(),
        })),
      };

      const res = await createRequisition(payload, token);
      const created = res?.data;
      setActionSuccess(
        `Requisición #${created?.requisition_id} (${created?.requisition_number}) creada en estado borrador (draft) con presupuesto estimado ${created?.currency_code} ${created?.estimated_total}.`
      );
      setReqNumber('');
      setJustification('');
      await loadList();
      if (created?.requisition_id) {
        await loadDetailById(created.requisition_id);
      }
    } catch (err) {
      setCreateError(err);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmSubmitRequisition = async () => {
    if (!selectedReq) return;
    setIsSubmittingAction(true);
    setDetailError(null);
    setActionSuccess(null);
    try {
      const res = await submitRequisition(selectedReq.requisition_id, token);
      setSubmitModalOpen(false);
      setActionSuccess(
        `Requisición #${selectedReq.requisition_id} enviada a aprobación (estado: ${res?.data?.status || 'submitted'}).`
      );
      await loadList();
      await loadDetailById(selectedReq.requisition_id);
    } catch (err) {
      setSubmitModalOpen(false);
      setDetailError(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const canSubmitSelected =
    selectedReq &&
    selectedReq.status === 'draft' &&
    Number(selectedReq.requester_user_id) === Number(user?.user_id) &&
    canCreate;

  return (
    <div>
      <section className="page-masthead" aria-labelledby="requisitions-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 01 DEL CIRCUITO — /api/operations/requisitions</span>
          <h1 id="requisitions-heading" className="page-title">
            Requisiciones de Compra y Presupuesto Autorizado
          </h1>
          <p className="page-description">
            Creación de solicitudes de compra asociadas al centro de costo del departamento del solicitante, consulta de líneas y pasos de aprobación, y envío a revisión.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">REGLAS DE PRESUPUESTO Y ENVÍO</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              La suma de <code>quantity_requested × estimated_unit_price</code> define el presupuesto máximo autorizado (incluidos los impuestos de la futura orden). Solo el usuario propietario (<code>requester_user_id</code>) puede enviar su borrador a aprobación.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            Usuario actual: #{user?.user_id} | Departamento: {user?.department_id ? `#${user.department_id}` : 'No asignado'}
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Operación completada</div>
          <div className="alert-body">{actionSuccess}</div>
        </div>
      ) : null}

      {/* Lookup by ID and Detail Panel */}
      <section className="section-block" aria-labelledby="req-detail-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">INSPECCIÓN DE DOCUMENTO — GET /api/operations/requisitions/:id</span>
            <h2 id="req-detail-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Detalle de Requisición, Líneas y Flujo de Aprobación
            </h2>
          </div>
          <form
            className="btn-group"
            onSubmit={(e) => {
              e.preventDefault();
              loadDetailById(lookupId.trim());
            }}
          >
            <input
              type="number"
              min="1"
              className="form-control mono"
              style={{ width: '170px', minHeight: '38px' }}
              placeholder="ID requisición..."
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              aria-label="ID de requisición a consultar"
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cargar por ID
            </button>
          </form>
        </div>

        <div className="section-body">
          <ErrorAlert error={detailError} title="Error al consultar o procesar la requisición" />

          {loadingDetail ? (
            <SkeletonLoader rows={2} columns={3} label="Cargando detalle de requisición..." />
          ) : !selectedReq ? (
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
              Selecciona una requisición de la tabla inferior o ingresa su ID para inspeccionar sus líneas (<code>requisition_lines</code>) y pasos de aprobación (<code>requisition_approvals</code>).
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="folio-num">REQUISICIÓN #{selectedReq.requisition_id}</span>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedReq.requisition_number}</h3>
                </div>
                <div className="btn-group">
                  <StatusBadge status={selectedReq.status} />
                  {canSubmitSelected ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setSubmitModalOpen(true)}
                    >
                      Enviar a aprobación (submit)
                    </button>
                  ) : null}
                  {selectedReq.status === 'approved' && hasRole('buyer') ? (
                    <Link
                      to={`/app/orders?requisition_id=${selectedReq.requisition_id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Crear Orden de Compra para esta requisición
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Solicitante (requester_user_id)</span>
                  <span className="kv-value mono">
                    #{selectedReq.requester_user_id}{' '}
                    {Number(selectedReq.requester_user_id) === Number(user?.user_id) ? '(Tú)' : ''}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Departamento / Centro Costo</span>
                  <span className="kv-value mono">
                    Depto #{selectedReq.department_id} / CC #{selectedReq.cost_center_id}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Presupuesto Estimado Total</span>
                  <span className="kv-value mono">
                    {selectedReq.currency_code} {selectedReq.estimated_total}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Fecha requerida (needed_by_date)</span>
                  <span className="kv-value mono">{formatCivilDate(selectedReq.needed_by_date)}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Enviada (submitted_at)</span>
                  <span className="kv-value mono">{formatUtcDateTime(selectedReq.submitted_at)}</span>
                </div>
              </div>

              <div style={{ padding: '0.875rem', background: 'var(--surface-canvas)', border: '1px solid var(--grid-hairline)' }}>
                <div className="kv-label">Justificación de negocio (business_justification)</div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{selectedReq.business_justification}</div>
              </div>

              {selectedReq.status === 'draft' && Number(selectedReq.requester_user_id) !== Number(user?.user_id) ? (
                <div className="alert-banner alert-info" style={{ marginBottom: 0 }}>
                  <div className="alert-title">Restricción de envío</div>
                  <div className="alert-body">
                    Esta requisición está en borrador, pero pertenece al usuario #{selectedReq.requester_user_id}. El servidor solo permite que el solicitante propietario ejecute <code>POST /api/operations/requisitions/:id/submit</code>.
                  </div>
                </div>
              ) : null}

              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  Líneas de la Requisición ({selectedReq.lines?.length || 0})
                </h4>
                <div className="table-scroll">
                  <table className="swiss-table">
                    <thead>
                      <tr>
                        <th>ID Línea (requisition_line_id)</th>
                        <th>Producto (product_id)</th>
                        <th>Categoría / Unidad</th>
                        <th>Cantidad solicitada</th>
                        <th>Precio unitario estimado</th>
                        <th>Moneda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReq.lines || []).map((line) => (
                        <tr key={line.requisition_line_id}>
                          <td className="mono">#{line.requisition_line_id}</td>
                          <td className="mono">Producto #{line.product_id}</td>
                          <td className="mono">
                            Cat #{line.category_id} | Unidad #{line.unit_id}
                          </td>
                          <td className="mono">{line.quantity_requested}</td>
                          <td className="mono">{line.estimated_unit_price}</td>
                          <td className="mono">{line.currency_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  Pasos de Aprobación Registrados ({selectedReq.approvals?.length || 0})
                </h4>
                {!selectedReq.approvals || selectedReq.approvals.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
                    Sin pasos generados todavía. Al enviar la requisición (<code>submit</code>), el servidor selecciona las reglas activas (<code>approval_rules</code>) según monto, moneda, departamento y vigencia.
                  </p>
                ) : (
                  <div className="table-scroll">
                    <table className="swiss-table">
                      <thead>
                        <tr>
                          <th>Orden Paso (step_order)</th>
                          <th>ID Aprobación</th>
                          <th>Regla (approval_rule_id)</th>
                          <th>Estado</th>
                          <th>Aprobador (approver_user_id)</th>
                          <th>Fecha Decisión</th>
                          <th>Comentarios</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReq.approvals.map((app) => (
                          <tr key={app.requisition_approval_id}>
                            <td className="mono">Paso {app.step_order}</td>
                            <td className="mono">#{app.requisition_approval_id}</td>
                            <td className="mono">Regla #{app.approval_rule_id}</td>
                            <td>
                              <StatusBadge status={app.status} />
                            </td>
                            <td className="mono">{app.approver_user_id ? `#${app.approver_user_id}` : '—'}</td>
                            <td className="mono">{formatUtcDateTime(app.decided_at)}</td>
                            <td>{app.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create Requisition Form */}
      {canCreate ? (
        <section className="section-block" aria-labelledby="create-req-heading">
          <div className="section-header">
            <div>
              <span className="folio-num">NUEVA SOLICITUD — POST /api/operations/requisitions</span>
              <h2 id="create-req-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                Crear Requisición en Borrador
              </h2>
            </div>
          </div>

          <form className="section-body" onSubmit={handleCreateSubmit}>
            <ErrorAlert error={createError} title="No se pudo crear la requisición" />

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="req-number" className="form-label">
                  Número de requisición (requisition_number) *
                </label>
                <input
                  id="req-number"
                  type="text"
                  required
                  maxLength={40}
                  className="form-control mono"
                  value={reqNumber}
                  onChange={(e) => setReqNumber(e.target.value)}
                  placeholder="Ej. REQ-2026-001"
                />
              </div>

              <div className="form-field">
                <label htmlFor="req-cost-center" className="form-label">
                  ID Centro de Costo (cost_center_id) *
                </label>
                <input
                  id="req-cost-center"
                  type="number"
                  required
                  min="1"
                  step="1"
                  className="form-control mono"
                  value={costCenterId}
                  onChange={(e) => setCostCenterId(e.target.value)}
                  placeholder="Debe pertenecer a tu departamento"
                />
                <span className="form-helper">
                  Tu departamento actual: {user?.department_id ? `#${user.department_id}` : 'Sin departamento'}
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="req-currency" className="form-label">
                  Código de Moneda (currency_code, 2 decimales) *
                </label>
                <input
                  id="req-currency"
                  type="text"
                  required
                  maxLength={3}
                  className="form-control mono"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  placeholder="CRC"
                />
              </div>

              <div className="form-field">
                <label htmlFor="req-needed-date" className="form-label">
                  Fecha requerida (needed_by_date, YYYY-MM-DD)
                </label>
                <input
                  id="req-needed-date"
                  type="date"
                  className="form-control mono"
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="req-justification" className="form-label">
                  Justificación de negocio (business_justification) *
                </label>
                <textarea
                  id="req-justification"
                  required
                  maxLength={10000}
                  className="form-control"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explica el motivo operativo de la compra..."
                />
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Líneas Solicitadas (productos únicos activos)</h3>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddLine}>
                  Añadir línea
                </button>
              </div>

              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID Producto (product_id) *</th>
                      <th>Cantidad (hasta 3 decimales) *</th>
                      <th>Precio unitario estimado (hasta 4 decimales) *</th>
                      <th>Subtotal línea (BigInt exacto)</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const lineCalc = computeLineAmountsStrings(
                        line.quantity_requested,
                        line.estimated_unit_price,
                        '0.0000'
                      );
                      return (
                        <tr key={line.key}>
                          <td>
                            <input
                              type="number"
                              required
                              min="1"
                              step="1"
                              className="form-control mono"
                              value={line.product_id}
                              onChange={(e) => handleLineChange(line.key, 'product_id', e.target.value)}
                              placeholder="ID producto"
                              aria-label="ID Producto"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              required
                              className="form-control mono"
                              value={line.quantity_requested}
                              onChange={(e) => handleLineChange(line.key, 'quantity_requested', e.target.value)}
                              placeholder="Ej. 2.000"
                              aria-label="Cantidad solicitada"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              required
                              className="form-control mono"
                              value={line.estimated_unit_price}
                              onChange={(e) => handleLineChange(line.key, 'estimated_unit_price', e.target.value)}
                              placeholder="Ej. 120.0000"
                              aria-label="Precio unitario estimado"
                            />
                          </td>
                          <td className="mono" style={{ verticalAlign: 'middle' }}>
                            {lineCalc.valid ? `${currencyCode} ${lineCalc.subtotal}` : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              disabled={lines.length <= 1}
                              onClick={() => handleRemoveLine(line.key)}
                            >
                              Quitar
                            </button>
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
                <span>Previsualización de presupuesto estimado (aritmética entera escalada):</span>
                <strong>
                  {previewTotals.valid
                    ? `${currencyCode || ''} ${previewTotals.subtotal}`
                    : previewTotals.error}
                </strong>
              </div>
            </div>

            <div className="btn-group" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Guardando requisición...' : 'Crear requisición en borrador'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Requisitions List */}
      <section className="section-block" aria-labelledby="req-list-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">COLECCIÓN — GET /api/operations/requisitions</span>
            <h2 id="req-list-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Historial de Requisiciones
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
              aria-label="Filtrar requisiciones por estado"
            >
              <option value="">Todos los estados</option>
              <option value="draft">draft (Borrador)</option>
              <option value="submitted">submitted (Enviada)</option>
              <option value="under_review">under_review (En revisión)</option>
              <option value="approved">approved (Aprobada)</option>
              <option value="rejected">rejected (Rechazada)</option>
              <option value="ordered">ordered (Con orden de compra)</option>
            </select>
            <button type="button" className="btn btn-sm btn-secondary" onClick={loadList}>
              Actualizar lista
            </button>
          </div>
        </div>

        <div className="section-body">
          {!canList ? (
            <EmptyState
              folio="LECTURA DE COLECCIÓN RESTRINGIDA"
              title="Tu rol actual no lista la colección general de requisiciones"
              description="La colección GET /api/operations/requisitions requiere rol requester, buyer, warehouse o admin. Si eres un aprobador asignado por regla especial, puedes consultar el detalle por ID arriba o abrir la Bandeja de Aprobaciones."
            >
              <Link to="/app/approvals" className="btn btn-primary">
                Ir a Bandeja de Aprobaciones
              </Link>
            </EmptyState>
          ) : (
            <>
              <ErrorAlert error={listError} title="Error al listar requisiciones" onRetry={loadList} />

              {loadingList ? (
                <SkeletonLoader rows={3} columns={4} label="Consultando requisiciones..." />
              ) : requisitions.length === 0 ? (
                <EmptyState
                  folio="SIN REQUISICIONES REGISTRADAS"
                  title="No se encontraron requisiciones para los criterios actuales"
                  description="Los solicitantes ven únicamente sus propias requisiciones; compradores, almacén y administración visualizan las requisiciones internas."
                />
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="swiss-table">
                      <thead>
                        <tr>
                          <th>ID / Número</th>
                          <th>Solicitante / Depto / CC</th>
                          <th>Presupuesto Estimado</th>
                          <th>Estado</th>
                          <th>Fecha Requerida</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requisitions.map((r) => (
                          <tr key={r.requisition_id}>
                            <td className="mono">
                              <strong>#{r.requisition_id}</strong> — {r.requisition_number}
                            </td>
                            <td className="mono">
                              Usuario #{r.requester_user_id} | Depto #{r.department_id} | CC #{r.cost_center_id}
                            </td>
                            <td className="mono">
                              <strong>
                                {r.currency_code} {r.estimated_total}
                              </strong>
                            </td>
                            <td>
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="mono">{formatCivilDate(r.needed_by_date)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => loadDetailById(r.requisition_id)}
                              >
                                Ver detalle / líneas
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
                    totalLabel="requisiciones"
                    onPageChange={setPage}
                    onLimitChange={(lim) => {
                      setLimit(lim);
                      setPage(1);
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </section>

      <ConfirmModal
        isOpen={submitModalOpen}
        folio="CONFIRMAR ENVÍO A APROBACIÓN"
        title={`Enviar requisición #${selectedReq?.requisition_id} (${selectedReq?.requisition_number})`}
        description="Al enviar la requisición, su estado cambiará de draft a submitted y el servidor generará los pasos de aprobación obligatorios según las reglas vigentes."
        warningNote="Una vez enviada, la requisición no puede editarse en el circuito inicial. Si no existe una regla de aprobación aplicable o hay reglas ambiguas en el mismo paso, el servidor rechazará el envío con HTTP 409."
        confirmLabel="Enviar requisición"
        isSubmitting={isSubmittingAction}
        onConfirm={handleConfirmSubmitRequisition}
        onCancel={() => setSubmitModalOpen(false)}
      />
    </div>
  );
}
