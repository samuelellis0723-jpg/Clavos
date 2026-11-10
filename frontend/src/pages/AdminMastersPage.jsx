import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/AuthContext.jsx';
import {
  MASTER_RESOURCES_POLICY,
  listAdminResource,
  createAdminResourceItem,
  updateAdminResourceItem,
  deleteAdminResourceItem,
} from '../services/adminService.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function AdminMastersPage() {
  const { token, hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const resourceKeys = Object.keys(MASTER_RESOURCES_POLICY);
  const [selectedResource, setSelectedResource] = useState('departments');
  const activePolicy = MASTER_RESOURCES_POLICY[selectedResource];

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Create form state
  const [createValues, setCreateValues] = useState({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit (PATCH) modal/panel state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Delete (DELETE 204) confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const resetCreateForm = useCallback((resourceName) => {
    const policy = MASTER_RESOURCES_POLICY[resourceName];
    if (!policy) return;
    const defaults = {};
    for (const f of policy.createFields) {
      defaults[f.name] = f.defaultValue !== undefined ? f.defaultValue : f.type === 'boolean' ? false : '';
    }
    setCreateValues(defaults);
    setCreateError(null);
    setEditingRecord(null);
    setUpdateError(null);
  }, []);

  useEffect(() => {
    resetCreateForm(selectedResource);
    setPage(1);
  }, [selectedResource, resetCreateForm]);

  const loadRecords = useCallback(async () => {
    if (!isAdmin || !activePolicy) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminResource(selectedResource, token, { page, limit });
      setRecords(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, activePolicy, selectedResource, token, page, limit]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleCreateFieldChange = (name, value) => {
    setCreateValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!activePolicy?.canCreate) return;
    setCreating(true);
    setCreateError(null);
    setActionSuccess(null);

    try {
      const payload = {};
      for (const fieldDef of activePolicy.createFields) {
        const rawVal = createValues[fieldDef.name];
        if (fieldDef.type === 'boolean') {
          payload[fieldDef.name] = Boolean(rawVal);
        } else if (rawVal === '' || rawVal === null || rawVal === undefined) {
          if (fieldDef.required) {
            payload[fieldDef.name] = '';
          }
        } else if (fieldDef.type === 'number') {
          payload[fieldDef.name] = Number(rawVal);
        } else {
          payload[fieldDef.name] = String(rawVal).trim();
        }
      }

      const res = await createAdminResourceItem(selectedResource, payload, token);
      const createdKey = res?.data?.[activePolicy.primaryKey];
      setActionSuccess(
        `Registro creado exitosamente en /api/${selectedResource} (${activePolicy.primaryKey}: ${createdKey}).`
      );
      resetCreateForm(selectedResource);
      await loadRecords();
    } catch (err) {
      setCreateError(err);
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (record) => {
    setEditingRecord(record);
    setUpdateError(null);
    const nextEdit = {};
    for (const fieldName of activePolicy.editableFields) {
      nextEdit[fieldName] = record[fieldName] ?? '';
    }
    setEditValues(nextEdit);
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingRecord || !activePolicy.editableFields.length) return;
    setUpdating(true);
    setUpdateError(null);
    setActionSuccess(null);

    try {
      const pkValue = editingRecord[activePolicy.primaryKey];
      const payload = {};
      for (const fieldName of activePolicy.editableFields) {
        const val = editValues[fieldName];
        if (typeof editingRecord[fieldName] === 'boolean') {
          payload[fieldName] = Boolean(val);
        } else if (val === '') {
          payload[fieldName] = null;
        } else {
          payload[fieldName] = val;
        }
      }

      await updateAdminResourceItem(selectedResource, pkValue, payload, token);
      setActionSuccess(
        `Registro ${activePolicy.primaryKey}=${pkValue} actualizado mediante PATCH /api/${selectedResource}/${pkValue}.`
      );
      setEditingRecord(null);
      await loadRecords();
    } catch (err) {
      setUpdateError(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const pkValue = deleteTarget[activePolicy.primaryKey];
    setDeleting(true);
    setError(null);
    setActionSuccess(null);

    try {
      await deleteAdminResourceItem(selectedResource, pkValue, token);
      setDeleteTarget(null);
      setActionSuccess(
        `Registro ${activePolicy.primaryKey}=${pkValue} eliminado (HTTP 204 No Content).`
      );
      await loadRecords();
    } catch (err) {
      setDeleteTarget(null);
      setError(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="masters-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">MANTENIMIENTO ADMINISTRATIVO — /api/&lt;recurso&gt;</span>
          <h1 id="masters-heading" className="page-title">
            Centro Unificado de Datos Maestros y Reglas de Negocio
          </h1>
          <p className="page-description">
            Administración centralizada de catálogos, organización, proveedores, almacenes y reglas, alineada exactamente con la lista blanca de <code>backend/middleware/crud-policy.js</code>.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">POLÍTICA DE PROTECCIÓN CRUD</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              • Solo los recursos y atributos permitidos muestran controles de creación (<code>POST</code>), edición parcial (<code>PATCH</code>) o eliminación (<code>DELETE</code>).<br />
              • Las tablas de usuarios, roles y evaluaciones se presentan en modo de solo lectura (sus escrituras web devuelven <code>405 USE_CASE_REQUIRED</code>).
            </p>
          </div>
        </div>
      </section>

      {!isAdmin ? (
        <EmptyState
          folio="ACCESO RESERVADO A ADMIN"
          title="El mantenimiento de datos maestros requiere el rol admin"
          description="Todos los endpoints bajo /api/<tabla> verifican el rol admin en el servidor."
        />
      ) : (
        <>
          {/* Resource Selector Bar */}
          <section className="section-block" aria-labelledby="resource-selector-heading">
            <div className="section-header">
              <div>
                <span className="folio-num">SELECTOR DE DOMINIO MAESTRO</span>
                <h2 id="resource-selector-heading" style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>
                  Recurso Activo: {activePolicy.label} (<code>/api/{selectedResource}</code>)
                </h2>
              </div>

              <div className="btn-group">
                <StatusBadge
                  customLabel={activePolicy.canCreate ? 'POST habilitado' : 'POST bloqueado (405)'}
                  toneOverride={activePolicy.canCreate ? 'success' : 'neutral'}
                />
                <StatusBadge
                  customLabel={
                    activePolicy.editableFields.length
                      ? `PATCH: ${activePolicy.editableFields.join(', ')}`
                      : 'PATCH bloqueado (Inmutable)'
                  }
                  toneOverride={activePolicy.editableFields.length ? 'accent' : 'neutral'}
                />
                <StatusBadge
                  customLabel={activePolicy.canDelete ? 'DELETE habilitado' : 'DELETE bloqueado (405)'}
                  toneOverride={activePolicy.canDelete ? 'warning' : 'neutral'}
                />
              </div>
            </div>

            <div className="section-body">
              <div className="btn-group">
                {resourceKeys.map((resKey) => {
                  const pol = MASTER_RESOURCES_POLICY[resKey];
                  const isSelected = resKey === selectedResource;
                  return (
                    <button
                      key={resKey}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSelectedResource(resKey)}
                    >
                      {pol.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {actionSuccess ? (
            <div className="alert-banner alert-success" role="status">
              <div className="alert-title">Cambio aplicado</div>
              <div className="alert-body">{actionSuccess}</div>
            </div>
          ) : null}

          <ErrorAlert error={error} title={`Error en /api/${selectedResource}`} onRetry={loadRecords} />

          {/* Edit Panel when a record is selected for PATCH */}
          {editingRecord && activePolicy.editableFields.length > 0 ? (
            <section className="section-block" aria-labelledby="edit-master-heading">
              <div className="section-header">
                <div>
                  <span className="folio-num">
                    EDICIÓN PARCIAL PERMITIDA — PATCH /api/{selectedResource}/
                    {editingRecord[activePolicy.primaryKey]}
                  </span>
                  <h2 id="edit-master-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                    Modificar Atributos Autorizados ({activePolicy.primaryKey}:{' '}
                    {editingRecord[activePolicy.primaryKey]})
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancelar edición
                </button>
              </div>

              <form className="section-body" onSubmit={handleUpdateSubmit}>
                <ErrorAlert error={updateError} title="No se pudo actualizar el registro" />

                <div className="form-grid">
                  {activePolicy.editableFields.map((fieldName) => (
                    <div key={fieldName} className="form-field">
                      <label htmlFor={`edit-${fieldName}`} className="form-label">
                        {fieldName}
                      </label>
                      {fieldName === 'status' ? (
                        <select
                          id={`edit-${fieldName}`}
                          className="form-control mono"
                          value={editValues[fieldName] ?? 'active'}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, [fieldName]: e.target.value }))
                          }
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                      ) : typeof editingRecord[fieldName] === 'boolean' ? (
                        <label className="checkbox-row">
                          <input
                            id={`edit-${fieldName}`}
                            type="checkbox"
                            checked={Boolean(editValues[fieldName])}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, [fieldName]: e.target.checked }))
                            }
                          />
                          <span>Activo / Verdadero</span>
                        </label>
                      ) : (
                        <input
                          id={`edit-${fieldName}`}
                          type="text"
                          className="form-control"
                          value={editValues[fieldName] ?? ''}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, [fieldName]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="btn-group" style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Guardando cambios...' : 'Guardar cambios permitidos (PATCH)'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {/* Create Form (only if allowed by crud-policy.js) */}
          {activePolicy.canCreate ? (
            <section className="section-block" aria-labelledby="create-master-heading">
              <div className="section-header">
                <div>
                  <span className="folio-num">ALTA DE MAESTRO — POST /api/{selectedResource}</span>
                  <h2 id="create-master-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                    Registrar Nuevo Elemento en {activePolicy.label}
                  </h2>
                </div>
              </div>

              <form className="section-body" onSubmit={handleCreateSubmit}>
                <ErrorAlert error={createError} title="No se pudo crear el registro maestro" />

                <div className="form-grid">
                  {activePolicy.createFields.map((field) => (
                    <div
                      key={field.name}
                      className={`form-field ${field.type === 'textarea' ? 'form-field-full' : ''}`}
                    >
                      <label htmlFor={`create-${field.name}`} className="form-label">
                        {field.label} ({field.name}) {field.required ? '*' : ''}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          id={`create-${field.name}`}
                          className="form-control mono"
                          value={createValues[field.name] ?? ''}
                          onChange={(e) => handleCreateFieldChange(field.name, e.target.value)}
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <label className="checkbox-row">
                          <input
                            id={`create-${field.name}`}
                            type="checkbox"
                            checked={Boolean(createValues[field.name])}
                            onChange={(e) => handleCreateFieldChange(field.name, e.target.checked)}
                          />
                          <span>Habilitado ({String(Boolean(createValues[field.name]))})</span>
                        </label>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={`create-${field.name}`}
                          required={field.required}
                          className="form-control"
                          value={createValues[field.name] ?? ''}
                          onChange={(e) => handleCreateFieldChange(field.name, e.target.value)}
                        />
                      ) : (
                        <input
                          id={`create-${field.name}`}
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required={field.required}
                          maxLength={field.maxLength}
                          className="form-control mono"
                          value={createValues[field.name] ?? ''}
                          onChange={(e) => handleCreateFieldChange(field.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="btn-group" style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Registrando...' : `Crear en ${activePolicy.label}`}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <div className="alert-banner alert-info" role="note">
              <div className="alert-title">Recurso de solo lectura en interfaz web (405 USE_CASE_REQUIRED)</div>
              <div className="alert-body">
                El recurso <code>/api/{selectedResource}</code> no admite creación ni edición mediante el CRUD genérico. Para usuarios y roles, utiliza el aprovisionamiento seguro por CLI (<code>npm run access:provision</code>).
              </div>
            </div>
          )}

          {/* Records Table */}
          <section className="section-block" aria-labelledby="records-table-heading">
            <div className="section-header">
              <div>
                <span className="folio-num">REGISTROS ACTUALES — GET /api/{selectedResource}</span>
                <h2 id="records-table-heading" style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                  Listado de {activePolicy.label} ({pagination.total})
                </h2>
              </div>
              <button type="button" className="btn btn-sm btn-secondary" onClick={loadRecords}>
                Recargar tabla
              </button>
            </div>

            <div className="section-body">
              {loading ? (
                <SkeletonLoader rows={3} columns={4} label={`Consultando /api/${selectedResource}...`} />
              ) : records.length === 0 ? (
                <EmptyState
                  folio="TABLA MAESTRA VACÍA"
                  title={`No hay registros en /api/${selectedResource}`}
                  description={
                    activePolicy.canCreate
                      ? 'Utiliza el formulario superior para dar de alta el primer registro.'
                      : 'No existen registros cargados actualmente en esta tabla.'
                  }
                />
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="swiss-table">
                      <thead>
                        <tr>
                          <th>Clave ({activePolicy.primaryKey})</th>
                          <th>Atributos Principales</th>
                          <th>Estado / Vigencia</th>
                          <th>Acciones Permitidas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((rec) => {
                          const pkVal = rec[activePolicy.primaryKey];
                          return (
                            <tr key={String(pkVal)}>
                              <td className="mono">
                                <strong>{pkVal}</strong>
                              </td>
                              <td>
                                <pre
                                  className="mono"
                                  style={{
                                    margin: 0,
                                    fontSize: '0.76rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {JSON.stringify(rec, null, 2)}
                                </pre>
                              </td>
                              <td>
                                {rec.status ? (
                                  <StatusBadge status={rec.status} />
                                ) : rec.is_active !== undefined ? (
                                  <StatusBadge
                                    customLabel={rec.is_active ? 'Activa (true)' : 'Inactiva (false)'}
                                    toneOverride={rec.is_active ? 'success' : 'neutral'}
                                  />
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>
                                <div className="btn-group">
                                  {activePolicy.editableFields.length > 0 ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => handleStartEdit(rec)}
                                    >
                                      Editar (PATCH)
                                    </button>
                                  ) : null}
                                  {activePolicy.canDelete ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-danger"
                                      onClick={() => setDeleteTarget(rec)}
                                    >
                                      Eliminar (DELETE)
                                    </button>
                                  ) : null}
                                  {activePolicy.editableFields.length === 0 && !activePolicy.canDelete ? (
                                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                                      Inmutable
                                    </span>
                                  ) : null}
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
                    totalLabel="registros maestros"
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
            isOpen={Boolean(deleteTarget)}
            folio="CONFIRMAR ELIMINACIÓN DE MAESTRO"
            title={`Eliminar registro ${activePolicy.primaryKey}=${
              deleteTarget?.[activePolicy.primaryKey]
            } de /api/${selectedResource}`}
            description="El servidor ejecutará DELETE sobre el registro seleccionado. Si el registro ya está referenciado por una clave foránea en MySQL, la operación será rechazada con HTTP 409 REFERENCE_CONFLICT."
            variant="danger"
            confirmLabel="Confirmar eliminación (DELETE)"
            isSubmitting={deleting}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        </>
      )}
    </div>
  );
}
