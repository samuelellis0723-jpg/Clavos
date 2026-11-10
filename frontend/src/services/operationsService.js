import { apiRequest, buildQueryString } from './apiClient.js';

/**
 * Private Operations & Analytics Service
 * Connects exclusively to documented /api/operations/* routes.
 */

export async function listOperationDocuments(kind, token, { page = 1, limit = 25, status } = {}, options = {}) {
  const qs = buildQueryString({ page, limit, status });
  return apiRequest(`/operations/${encodeURIComponent(kind)}${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function getOperationDocumentDetail(kind, id, token, options = {}) {
  return apiRequest(`/operations/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function createRequisition(payload, token, options = {}) {
  return apiRequest('/operations/requisitions', {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function submitRequisition(requisitionId, token, options = {}) {
  return apiRequest(`/operations/requisitions/${encodeURIComponent(requisitionId)}/submit`, {
    method: 'POST',
    token,
    ...options,
  });
}

export async function listPendingApprovals(token, { page = 1, limit = 25 } = {}, options = {}) {
  const qs = buildQueryString({ page, limit });
  return apiRequest(`/operations/approvals${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function decideRequisitionApproval(requisitionId, { decision, comments }, token, options = {}) {
  const body = { decision };
  if (comments && String(comments).trim() !== '') {
    body.comments = String(comments).trim();
  }
  return apiRequest(`/operations/requisitions/${encodeURIComponent(requisitionId)}/decision`, {
    method: 'POST',
    token,
    body,
    ...options,
  });
}

export async function createPurchaseOrder(requisitionId, payload, token, options = {}) {
  return apiRequest(`/operations/requisitions/${encodeURIComponent(requisitionId)}/orders`, {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function sendPurchaseOrder(orderId, token, options = {}) {
  return apiRequest(`/operations/orders/${encodeURIComponent(orderId)}/send`, {
    method: 'POST',
    token,
    ...options,
  });
}

export async function registerOrderReceipt(orderId, payload, token, options = {}) {
  return apiRequest(`/operations/orders/${encodeURIComponent(orderId)}/receipts`, {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function registerOrderInvoice(orderId, payload, token, options = {}) {
  return apiRequest(`/operations/orders/${encodeURIComponent(orderId)}/invoices`, {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function approveSupplierInvoice(invoiceId, token, options = {}) {
  return apiRequest(`/operations/invoices/${encodeURIComponent(invoiceId)}/approve`, {
    method: 'POST',
    token,
    ...options,
  });
}

export async function scheduleInvoicePayment(invoiceId, { payment_reference, payment_method }, token, options = {}) {
  return apiRequest(`/operations/invoices/${encodeURIComponent(invoiceId)}/payments`, {
    method: 'POST',
    token,
    body: { payment_reference, payment_method },
    ...options,
  });
}

export async function confirmScheduledPayment(paymentId, { payment_date, bank_reference }, token, options = {}) {
  return apiRequest(`/operations/payments/${encodeURIComponent(paymentId)}/confirm`, {
    method: 'POST',
    token,
    body: { payment_date, bank_reference },
    ...options,
  });
}

export async function fetchInventoryBalance({ product_id, warehouse_id }, token, options = {}) {
  const qs = buildQueryString({ product_id, warehouse_id });
  return apiRequest(`/operations/inventory/balance${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function createInventoryTransfer(payload, token, options = {}) {
  return apiRequest('/operations/inventory/transfers', {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function fetchSpendAnalytics({ date_from, date_to }, token, options = {}) {
  const qs = buildQueryString({ date_from, date_to });
  return apiRequest(`/operations/analytics/spend${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function fetchSupplierEvaluationAnalytics(evaluationId, token, options = {}) {
  return apiRequest(`/operations/analytics/evaluations/${encodeURIComponent(evaluationId)}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function fetchReorderAnalytics({ product_id, warehouse_id, page = 1, limit = 25 } = {}, token, options = {}) {
  const qs = buildQueryString({ product_id, warehouse_id, page, limit });
  return apiRequest(`/operations/analytics/reorder${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}
