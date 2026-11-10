import React, { useState } from 'react';
import { useAuth } from '../features/AuthContext.jsx';
import { fetchInventoryBalance, createInventoryTransfer } from '../services/operationsService.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function InventoryPage() {
  const { token, hasRole } = useAuth();
  const canCheckBalance = hasRole('warehouse', 'buyer', 'analyst');
  const canTransfer = hasRole('warehouse');

  // Balance inquiry state
  const [balProductId, setBalProductId] = useState('');
  const [balWarehouseId, setBalWarehouseId] = useState('');
  const [balanceResult, setBalanceResult] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState(null);

  // Transfer state
  const [movementNumber, setMovementNumber] = useState('');
  const [txProductId, setTxProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [txQuantity, setTxQuantity] = useState('1.000');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  const handleBalanceSubmit = async (event) => {
    event.preventDefault();
    setLoadingBalance(true);
    setBalanceError(null);
    try {
      const res = await fetchInventoryBalance(
        {
          product_id: Number(balProductId),
          warehouse_id: Number(balWarehouseId),
        },
        token
      );
      setBalanceResult(res?.data || null);
    } catch (err) {
      setBalanceError(err);
      setBalanceResult(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePrepareTransfer = (event) => {
    event.preventDefault();
    setTransferError(null);
    setTransferResult(null);
    if (Number(fromWarehouseId) === Number(toWarehouseId)) {
      setTransferError('El almacén de origen y el almacén de destino deben ser distintos (400 SAME_WAREHOUSE).');
      return;
    }
    setTransferModalOpen(true);
  };

  const handleConfirmTransfer = async () => {
    setSubmittingTransfer(true);
    setTransferError(null);
    setTransferResult(null);

    try {
      const payload = {
        movement_number: movementNumber.trim(),
        product_id: Number(txProductId),
        from_warehouse_id: Number(fromWarehouseId),
        to_warehouse_id: Number(toWarehouseId),
        quantity: String(txQuantity).trim(),
      };
      const res = await createInventoryTransfer(payload, token);
      setTransferModalOpen(false);
      setTransferResult(res?.data || null);
      setMovementNumber('');

      // If balance query matches product, refresh it automatically
      if (balProductId && balWarehouseId) {
        try {
          const updatedBal = await fetchInventoryBalance(
            { product_id: Number(balProductId), warehouse_id: Number(balWarehouseId) },
            token
          );
          setBalanceResult(updatedBal?.data || null);
        } catch {
          // ignore secondary refresh error
        }
      }
    } catch (err) {
      setTransferModalOpen(false);
      setTransferError(err);
    } finally {
      setSubmittingTransfer(false);
    }
  };

  return (
    <div>
      <section className="page-masthead" aria-labelledby="inventory-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">PASO 05 DEL CIRCUITO — /api/operations/inventory/*</span>
          <h1 id="inventory-heading" className="page-title">
            Saldos de Inventario y Traslados entre Almacenes
          </h1>
          <p className="page-description">
            Consulta en tiempo real de existencias en mano, reservadas y disponibles por producto y almacén, y ejecución transaccional de traslados internos.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">POLÍTICA DE EXISTENCIAS Y LOTES</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              El saldo en mano (<code>on_hand</code>) es la suma exacta de <code>inventory_movement_lines.quantity_change</code>; <code>available = on_hand - reserved</code> (reservas activas no liberadas ni expiradas). Los productos con movimientos por lote requieren una política de selección de lotes aún no habilitada (<code>409 LOT_POLICY_REQUIRED</code>).
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.78rem' }}>
            movement_number admite máximo 35 caracteres (genera :out e :in)
          </div>
        </div>
      </section>

      <div className="swiss-grid swiss-grid-2">
        {/* Balance Inquiry */}
        <section className="swiss-cell" aria-labelledby="balance-query-heading">
          <span className="folio-num">CONSULTA — GET /api/operations/inventory/balance</span>
          <h2 id="balance-query-heading" style={{ fontSize: '1.15rem' }}>
            Consultar Saldo por Producto y Almacén
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            Roles autorizados: <code>warehouse</code>, <code>buyer</code>, <code>analyst</code>, <code>admin</code>.
          </p>

          <ErrorAlert error={balanceError} title="No se pudo consultar el saldo de inventario" />

          {canCheckBalance ? (
            <form onSubmit={handleBalanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="bal-product-id" className="form-label">
                    ID Producto (product_id) *
                  </label>
                  <input
                    id="bal-product-id"
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={balProductId}
                    onChange={(e) => setBalProductId(e.target.value)}
                    placeholder="Ej. 1"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="bal-warehouse-id" className="form-label">
                    ID Almacén (warehouse_id) *
                  </label>
                  <input
                    id="bal-warehouse-id"
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={balWarehouseId}
                    onChange={(e) => setBalWarehouseId(e.target.value)}
                    placeholder="Ej. 1"
                  />
                </div>
              </div>

              <div>
                <button type="submit" className="btn btn-primary" disabled={loadingBalance}>
                  {loadingBalance ? 'Consultando saldo...' : 'Consultar saldo actual'}
                </button>
              </div>
            </form>
          ) : (
            <div className="alert-banner alert-warning">
              <div className="alert-title">Sin permiso de lectura de saldo</div>
              <div className="alert-body">Tu rol actual no incluye warehouse, buyer, analyst ni admin.</div>
            </div>
          )}

          {balanceResult ? (
            <div style={{ marginTop: '1rem' }}>
              <span className="folio-num">
                RESULTADO — PRODUCTO #{balanceResult.product_id} EN ALMACÉN #{balanceResult.warehouse_id}
              </span>
              <div className="kv-grid" style={{ marginTop: '0.5rem' }}>
                <div className="kv-item">
                  <span className="kv-label">En Mano (on_hand)</span>
                  <span className="kv-value mono">{balanceResult.on_hand}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Reservado (reserved)</span>
                  <span className="kv-value mono">{balanceResult.reserved}</span>
                </div>
                <div className="kv-item">
                  <span className="kv-label">Disponible (available)</span>
                  <span className="kv-value mono" style={{ color: 'var(--accent-klein)' }}>
                    {balanceResult.available}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Warehouse Transfer */}
        <section className="swiss-cell" aria-labelledby="transfer-heading">
          <span className="folio-num">TRASLADO — POST /api/operations/inventory/transfers</span>
          <h2 id="transfer-heading" style={{ fontSize: '1.15rem' }}>
            Ejecutar Traslado entre Almacenes
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            Roles autorizados: <code>warehouse</code>, <code>admin</code>. Bloquea el producto y ambos almacenes en transacción y verifica que <code>available &gt;= quantity</code>.
          </p>

          <ErrorAlert error={transferError} title="No se pudo ejecutar el traslado" />

          {transferResult ? (
            <div className="alert-banner alert-success" role="status">
              <div className="alert-title">Traslado registrado exitosamente (HTTP 201)</div>
              <div className="alert-body mono">
                Movimiento de salida (transfer_out): <strong>#{transferResult.outgoing_movement_id}</strong> | Movimiento de entrada (transfer_in): <strong>#{transferResult.incoming_movement_id}</strong>
              </div>
            </div>
          ) : null}

          {canTransfer ? (
            <form onSubmit={handlePrepareTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="tx-number" className="form-label">
                    Número de movimiento (movement_number, máx. 35) *
                  </label>
                  <input
                    id="tx-number"
                    type="text"
                    required
                    maxLength={35}
                    className="form-control mono"
                    value={movementNumber}
                    onChange={(e) => setMovementNumber(e.target.value)}
                    placeholder="Ej. TR-2026-001"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="tx-product" className="form-label">
                    ID Producto inventariable activo (product_id) *
                  </label>
                  <input
                    id="tx-product"
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={txProductId}
                    onChange={(e) => setTxProductId(e.target.value)}
                    placeholder="ID producto"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="tx-from" className="form-label">
                    ID Almacén Origen (from_warehouse_id) *
                  </label>
                  <input
                    id="tx-from"
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    placeholder="Origen"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="tx-to" className="form-label">
                    ID Almacén Destino (to_warehouse_id) *
                  </label>
                  <input
                    id="tx-to"
                    type="number"
                    required
                    min="1"
                    step="1"
                    className="form-control mono"
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    placeholder="Destino (distinto al origen)"
                  />
                </div>

                <div className="form-field form-field-full">
                  <label htmlFor="tx-qty" className="form-label">
                    Cantidad a trasladar (quantity, hasta 3 decimales) *
                  </label>
                  <input
                    id="tx-qty"
                    type="text"
                    required
                    className="form-control mono"
                    value={txQuantity}
                    onChange={(e) => setTxQuantity(e.target.value)}
                    placeholder="1.000"
                  />
                </div>
              </div>

              <div>
                <button type="submit" className="btn btn-primary" disabled={submittingTransfer}>
                  Revisar y ejecutar traslado
                </button>
              </div>
            </form>
          ) : (
            <div className="alert-banner alert-info">
              <div className="alert-title">Escritura reservada a almacén</div>
              <div className="alert-body">
                Para registrar traslados entre almacenes se requiere el rol <code>warehouse</code> o <code>admin</code>.
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        isOpen={transferModalOpen}
        folio="CONFIRMAR TRASLADO ENTRE ALMACENES"
        title={`Trasladar ${txQuantity} u. del Producto #${txProductId} (Almacén #${fromWarehouseId} → #${toWarehouseId})`}
        description={`Se generarán los movimientos vinculados ${movementNumber}:out y ${movementNumber}:in dentro de una misma transacción en MySQL.`}
        warningNote="Los movimientos de inventario registrados no pueden revertirse por CRUD genérico. Los traslados conservan las cantidades físicas y dejan la valuación contable (FIFO/promedio) sujeta a la política empresarial."
        confirmLabel="Confirmar traslado"
        isSubmitting={submittingTransfer}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setTransferModalOpen(false)}
      />
    </div>
  );
}
