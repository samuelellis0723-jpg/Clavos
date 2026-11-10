import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/AuthContext.jsx';
import {
  listPendingApprovals,
  getOperationDocumentDetail,
  decideRequisitionApproval,
} from '../services/operationsService.js';
import { formatUtcDateTime } from '../features/formatters.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function ApprovalsPage() {
  const { token, user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [approvals, setApprovals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected requisition for review & decision
  const [manualReqId, setManualReqId] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Decision modal state
  const [decisionModal, setDecisionModal] = useState({
    open: false,
    requisitionId: null,
    decision: 'approved',
    comments: '',
  });
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPendingApprovals(token, { page, limit });
      setApprovals(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const loadRequisitionForReview = useCallback(
    async (reqId) => {
      if (!reqId) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await getOperationDocumentDetail('requisitions', reqId, token);
        setSelectedReq(res?.data || null);
      } catch (err) {
        setDetailError(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token]
  );

  const openDecisionModal = (requisitionId, decisionType) => {
    setDecisionModal({
      open: true,
      requisitionId,
      decision: decisionType,
      comments: '',
    });
  };

  const handleConfirmDecision = async () => {
    const { requisitionId, decision, comments } = decisionModal;
    if (!requisitionId) return;
    setSubmittingDecision(true);
    setDetailError(null);
    setActionSuccess(null);

    try {
      const res = await decideRequisitionApproval(
        requisitionId,
        { decision, comments },
        token
      );
      setDecisionModal({ open: false, requisitionId: null, decision: 'approved', comments: '' });
      setActionSuccess(
        `Decisión (${decision}) registrada en la requisición #${requisitionId}. Estado resultante: ${
          res?.data?.status || decision
        }.`
      );
      await loadApprovals();
      await loadRequisitionForReview(requisitionId);
    } catch (err) {
      setDecisionModal((prev) => ({ ...prev, open: false }));
      setDetailError(err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="approvals-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 02 DEL CIRCUITO — /api/operations/approvals</span>
          <h1 id="approvals-heading" className="page-title">
            Bandeja de Aprobaciones y Decisión por Paso
          </h1>
          <p className="page-description">
            Muestra los pasos de aprobación en estado <code>pending</code> cuyas reglas (<code>approval_rules</code>) exigen alguno de los <code>role_ids</code> asignados a tu cuenta actual, sobre requisiciones en estado <code>submitted</code> o <code>under_review</code>.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">SEGREGACIÓN DE FUNCIONES</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              1) El solicitante nunca puede aprobar su propia requisición (<code>403 SELF_APPROVAL</code>).<br />
              2) Se comprueba en MySQL el rol exacto del paso pendiente (<code>approver_role_id</code>); el rol técnico <code>admin</code> no lo sustituye (<code>403 APPROVER_ROLE_REQUIRED</code>).
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            Tus role_ids: {(user?.role_ids || []).join(', ') || 'ninguno'} ({(user?.roles || []).join(', ')})
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div className="alert-banner alert-success" role="status">
          <div className="alert-title">Decisión registrada</div>
          <div className="alert-body">{actionSuccess}</div>
        </div>
      ) : null}

      <ErrorAlert error={error} title="Error al cargar la bandeja de aprobaciones" onRetry={loadApprovals} />
      <ErrorAlert error={detailError} title="No se pudo procesar la decisión o consulta" onDismiss={() => setDetailError(null)} />

      {/* Review & Decision Workspace */}
      <section className="section-block" aria-labelledby="review-req-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">REVISIÓN Y DECISIÓN — POST /api/operations/requisitions/:id/decision</span>
            <h2 id="review-req-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Inspeccionar Requisición y Emitir Decisión
            </h2>
          </div>

          <form
            className="btn-group"
            onSubmit={(e) => {
              e.preventDefault();
              loadRequisitionForReview(manualReqId.trim());
            }}
          >
            <input
              type="number"
              min="1"
              className="form-control mono"
              style={{ width: '175px', minHeight: '38px' }}
              placeholder="ID requisición..."
              value={manualReqId}
              onChange={(e) => setManualReqId(e.target.value)}
              aria-label="ID de requisición a revisar"
            />
            <button type="submit" className="btn btn-sm btn-secondary">
              Cargar requisición
            </button>
          </form>
        </div>

        <div className="section-body">
          {loadingDetail ? (
            <SkeletonLoader rows={2} columns={3} label="Consultando detalle de la requisición..." />
          ) : !selectedReq ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
              Selecciona cualquier paso pendiente en la bandeja inferior o introduce el ID de una requisición para revisar su justificación, líneas y pasos antes de aprobar o rechazar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="folio-num">REQUISICIÓN #{selectedReq.requisition_id}</span>
                  <h3 style={{ fontSize: '1.2rem' }}>{selectedReq.requisition_number}</h3>
                </div>
                <div className="btn-group">
                  <StatusBadge status={selectedReq.status} />
                  {['submitted', 'under_review'].includes(selectedReq.status) ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={Number(selectedReq.requester_user_id) === Number(user?.user_id)}
                        onClick={() => openDecisionModal(selectedReq.requisition_id, 'approved')}
                      >
                        Aprobar paso actual (approved)
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={Number(selectedReq.requester_user_id) === Number(user?.user_id)}
                        onClick={() => openDecisionModal(selectedReq.requisition_id, 'rejected')}
                      >
                        Rechazar requisición (rejected)
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {Number(selectedReq.requester_user_id) === Number(user?.user_id) ? (
                <div className="alert-banner alert-warning" style={{ marginBottom: 0 }}>
                  <div className="alert-title">Autoaprobación bloqueada (SELF_APPROVAL)</div>
                  <div className="alert-body">
                    Eres el solicitante de esta requisición (usuario #{selectedReq.requester_user_id}). Una persona distinta con el rol del paso pendiente debe tomar la decisión.
                  </div>
                </div>
              ) : null}

              <div className="kv-grid">
                <div className="kv-item">
                  <span className="kv-label">Solicitante</span>
                  <span className="kv-value mono">Usuario #{selectedReq.requester_user_id}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Depto / Centro Costo</span>
                  <span className="kv-value mono">
                    Depto #{selectedReq.department_id} / CC #{selectedReq.cost_center_id}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Monto Total Estimado</span>
                  <span className="kv-value mono">
                    {selectedReq.currency_code} {selectedReq.estimated_total}
                  </span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Justificación</span>
                  <span className="kv-value" style={{ fontSize: '0.85rem' }}>
                    {selectedReq.business_justification}
                  </span>
                </div>
              </div>

              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>Paso (step_order)</th>
                      <th>Regla (approval_rule_id)</th>
                      <th>Estado</th>
                      <th>Decidido por</th>
                      <th>Fecha</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReq.approvals || []).map((step) => (
                      <tr key={step.requisition_approval_id}>
                        <td className="mono">Paso {step.step_order}</td>
                        <td className="mono">Regla #{step.approval_rule_id}</td>
                        <td>
                          <StatusBadge status={step.status} />
                        </td>
                        <td className="mono">{step.approver_user_id ? `#${step.approver_user_id}` : '—'}</td>
                        <td className="mono">{formatUtcDateTime(step.decided_at)}</td>
                        <td>{step.comments || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pending Approvals Queue */}
      <section className="section-block" aria-labelledby="queue-heading">
        <div className="section-header">
          <div>
            <span className="folio-num">COLA ACTIVA — GET /api/operations/approvals</span>
            <h2 id="queue-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
              Pasos Pendientes Asignados a tus Roles
            </h2>
          </div>
          <button type="button" className="btn btn-sm btn-secondary" onClick={loadApprovals}>
            Actualizar bandeja
          </button>
        </div>

        <div className="section-body">
          {loading ? (
            <SkeletonLoader rows={2} columns={4} label="Consultando GET /api/operations/approvals..." />
          ) : approvals.length === 0 ? (
            <EmptyState
              folio="BANDEJA DE APROBACIONES VACÍA"
              title="No tienes pasos de aprobación pendientes para tus roles actuales"
              description="Cuando una requisición enviada tenga un paso pendiente cuyo approver_role_id coincida con alguno de tus role_ids, aparecerá en esta tabla."
            />
          ) : (
            <>
              <div className="table-scroll">
                <table className="swiss-table">
                  <thead>
                    <tr>
                      <th>ID Aprobación / Paso</th>
                      <th>Requisición</th>
                      <th>Regla Aplicada</th>
                      <th>Monto Requisición</th>
                      <th>Solicitante</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((item) => {
                      const reqObj = item.requisitionId || {};
                      const ruleObj = item.approvalRuleId || {};
                      const reqId = item.requisition_id || reqObj.requisition_id;
                      const isOwnReq = Number(reqObj.requester_user_id) === Number(user?.user_id);

                      return (
                        <tr key={item.requisition_approval_id}>
                          <td className="mono">
                            <strong>#{item.requisition_approval_id}</strong> — Paso {item.step_order}
                          </td>
                          <td className="mono">
                            #{reqId} ({reqObj.requisition_number || '—'})
                            <div style={{ marginTop: '0.2rem' }}>
                              <StatusBadge status={reqObj.status || item.status} />
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {ruleObj.rule_name || `Regla #${item.approval_rule_id}`}
                            </div>
                            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                              Rol exigido ID: #{ruleObj.approver_role_id ?? '—'}
                            </div>
                          </td>
                          <td className="mono">
                            <strong>
                              {reqObj.currency_code} {reqObj.estimated_total}
                            </strong>
                          </td>
                          <td className="mono">
                            Usuario #{reqObj.requester_user_id ?? '—'} {isOwnReq ? '(Tú)' : ''}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => loadRequisitionForReview(reqId)}
                              >
                                Inspeccionar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                disabled={isOwnReq}
                                onClick={() => openDecisionModal(reqId, 'approved')}
                              >
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                disabled={isOwnReq}
                                onClick={() => openDecisionModal(reqId, 'rejected')}
                              >
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalLabel="pasos pendientes"
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
        isOpen={decisionModal.open}
        folio="CONFIRMAR DECISIÓN DE APROBACIÓN"
        title={
          decisionModal.decision === 'approved'
            ? `Aprobar paso actual de Requisición #${decisionModal.requisitionId}`
            : `Rechazar Requisición #${decisionModal.requisitionId}`
        }
        description={
          decisionModal.decision === 'approved'
            ? 'El servidor verificará que posees el rol exacto exigido por el paso pendiente actual y avanzará la requisición a under_review (si restan pasos) o approved (si fue el último paso).'
            : 'Al rechazar este paso, la requisición cambiará a estado rejected de forma definitiva.'
        }
        variant={decisionModal.decision === 'rejected' ? 'danger' : 'primary'}
        confirmLabel={
          decisionModal.decision === 'approved' ? 'Confirmar aprobación' : 'Confirmar rechazo'
        }
        isSubmitting={submittingDecision}
        onConfirm={handleConfirmDecision}
        onCancel={() =>
          setDecisionModal({ open: false, requisitionId: null, decision: 'approved', comments: '' })
        }
      >
        <div className="form-field">
          <label htmlFor="decision-comments" className="form-label">
            Comentarios de revisión (comments, opcional)
          </label>
          <textarea
            id="decision-comments"
            className="form-control"
            maxLength={10000}
            value={decisionModal.comments}
            onChange={(e) =>
              setDecisionModal((prev) => ({ ...prev, comments: e.target.value }))
            }
            placeholder="Anota observaciones de presupuesto, proveedor o motivo de la decisión..."
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
