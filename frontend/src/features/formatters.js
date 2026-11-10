/**
 * Formatting helpers for Clavos UI.
 * Never converts decimal strings to IEEE-754 Number for money calculations.
 */

export function formatUtcDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
}

export function formatCivilDate(dateString) {
  if (!dateString) return '—';
  return String(dateString).slice(0, 10);
}

export function formatAgeSeconds(ageSeconds) {
  if (ageSeconds === null || ageSeconds === undefined || Number.isNaN(Number(ageSeconds))) {
    return 'Edad no disponible';
  }
  const sec = Math.max(0, Math.floor(Number(ageSeconds)));
  if (sec < 60) return `hace ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d (${hours} h)`;
}

export function describeFreshness(freshness) {
  switch (freshness) {
    case 'recent_observation':
      return {
        label: 'Observación reciente (según política)',
        tone: 'success',
        explanation: 'Dentro del umbral PRICE_MAX_AGE_HOURS configurado. No garantiza el precio actual en tienda.',
      };
    case 'stale':
      return {
        label: 'Observación antigua (stale)',
        tone: 'warning',
        explanation: 'Supera el umbral de antigüedad configurado. Se conserva como registro histórico.',
      };
    case 'age_policy_not_configured':
      return {
        label: 'Sin política de antigüedad activa',
        tone: 'neutral',
        explanation: 'PRICE_MAX_AGE_HOURS no está definido en el servidor; se muestra la fecha histórica sin afirmar vigencia.',
      };
    default:
      return {
        label: freshness || 'Estado no especificado',
        tone: 'neutral',
        explanation: 'Observación histórica registrada.',
      };
  }
}

export function describeDocumentStatus(status) {
  const map = {
    active: { label: 'Activo', tone: 'success' },
    inactive: { label: 'Inactivo', tone: 'neutral' },
    draft: { label: 'Borrador (draft)', tone: 'neutral' },
    submitted: { label: 'Enviada (submitted)', tone: 'warning' },
    under_review: { label: 'En revisión (under_review)', tone: 'warning' },
    pending: { label: 'Pendiente (pending)', tone: 'warning' },
    approved: { label: 'Aprobado (approved)', tone: 'success' },
    rejected: { label: 'Rechazado (rejected)', tone: 'danger' },
    ordered: { label: 'Ordenada (ordered)', tone: 'accent' },
    sent: { label: 'Enviada (sent)', tone: 'accent' },
    acknowledged: { label: 'Confirmada (acknowledged)', tone: 'accent' },
    partially_received: { label: 'Recepción parcial (partially_received)', tone: 'warning' },
    received: { label: 'Recibida completa (received)', tone: 'success' },
    posted: { label: 'Registrada (posted)', tone: 'success' },
    matched: { label: 'Conciliada (matched)', tone: 'accent' },
    disputed: { label: 'En disputa (disputed)', tone: 'danger' },
    partially_paid: { label: 'Pago parcial (partially_paid)', tone: 'warning' },
    paid: { label: 'Pagada (paid)', tone: 'success' },
    scheduled: { label: 'Programado (scheduled)', tone: 'warning' },
    processing: { label: 'En proceso (processing)', tone: 'warning' },
    completed: { label: 'Completado (completed)', tone: 'success' },
    completed_with_errors: { label: 'Completado con rechazos', tone: 'warning' },
    failed: { label: 'Fallido (failed)', tone: 'danger' },
    running: { label: 'En ejecución (running)', tone: 'warning' },
    cancelled: { label: 'Cancelado (cancelled)', tone: 'danger' },
  };
  return map[status] || { label: status || '—', tone: 'neutral' };
}
