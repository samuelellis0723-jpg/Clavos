import React, { useEffect, useRef } from 'react';

export default function ConfirmModal({
  isOpen,
  title,
  folio = 'CONFIRMACIÓN REQUERIDA',
  description,
  warningNote,
  confirmLabel = 'Confirmar operación',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isSubmitting = false,
  onConfirm,
  onCancel,
  children,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    confirmBtnRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onCancel?.()}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="folio-num">{folio}</span>
            <h2 id="confirm-modal-title" style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Cerrar ventana de confirmación"
          >
            Cerrar
          </button>
        </div>
        <div className="modal-body">
          {description ? <p style={{ fontSize: '0.925rem', color: 'var(--ink-primary)' }}>{description}</p> : null}
          {warningNote ? (
            <div className="alert-banner alert-warning" style={{ marginBottom: 0 }}>
              <div className="alert-title">Aviso de integridad operativa</div>
              <div className="alert-body">{warningNote}</div>
            </div>
          ) : null}
          {children}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
