import { apiRequest, buildQueryString } from './apiClient.js';

/**
 * Administrative Master Data & Price Imports Service
 * Strictly adheres to backend/middleware/crud-policy.js and /api/admin/price-imports.
 */

export const MASTER_RESOURCES_POLICY = {
  departments: {
    label: 'Departamentos',
    group: 'Organización y Finanzas',
    primaryKey: 'department_id',
    canCreate: true,
    canDelete: true,
    editableFields: ['name', 'description', 'status'],
    createFields: [
      { name: 'name', label: 'Nombre del departamento', type: 'text', required: true, maxLength: 120 },
      { name: 'description', label: 'Descripción', type: 'textarea', required: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  cost_centers: {
    label: 'Centros de Costo',
    group: 'Organización y Finanzas',
    primaryKey: 'cost_center_id',
    canCreate: true,
    canDelete: true,
    editableFields: ['name', 'status'],
    createFields: [
      { name: 'code', label: 'Código', type: 'text', required: true, maxLength: 30 },
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 120 },
      { name: 'department_id', label: 'ID de Departamento', type: 'number', required: true },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  currencies: {
    label: 'Monedas',
    group: 'Organización y Finanzas',
    primaryKey: 'currency_code',
    canCreate: true,
    canDelete: false,
    editableFields: ['name', 'symbol', 'status'],
    createFields: [
      { name: 'currency_code', label: 'Código ISO (3 letras, ej. CRC)', type: 'text', required: true, maxLength: 3 },
      { name: 'name', label: 'Nombre de la moneda', type: 'text', required: true, maxLength: 60 },
      { name: 'symbol', label: 'Símbolo', type: 'text', required: false, maxLength: 8 },
      { name: 'decimal_places', label: 'Decimales (circuito exige 2)', type: 'number', defaultValue: 2, required: true },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  expense_categories: {
    label: 'Categorías de Gasto / Producto',
    group: 'Organización y Finanzas',
    primaryKey: 'category_id',
    canCreate: true,
    canDelete: true,
    editableFields: ['name', 'description', 'status'],
    createFields: [
      { name: 'code', label: 'Código de categoría', type: 'text', required: true, maxLength: 40 },
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 120 },
      { name: 'parent_category_id', label: 'ID Categoría Padre (opcional)', type: 'number', required: false },
      { name: 'description', label: 'Descripción', type: 'textarea', required: false },
      { name: 'is_capital_expense', label: 'Gasto de capital (CAPEX)', type: 'boolean', defaultValue: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  approval_rules: {
    label: 'Reglas de Aprobación',
    group: 'Organización y Finanzas',
    primaryKey: 'approval_rule_id',
    canCreate: true,
    canDelete: false,
    editableFields: [], // Inmutable por crud-policy.js
    createFields: [
      { name: 'rule_name', label: 'Nombre de la regla', type: 'text', required: true, maxLength: 120 },
      { name: 'min_amount', label: 'Monto mínimo (2 decimales)', type: 'decimal', defaultValue: '0.00', required: true },
      { name: 'max_amount', label: 'Monto máximo (opcional, 2 decimales)', type: 'decimal', required: false },
      { name: 'currency_code', label: 'Moneda (3 letras)', type: 'text', required: true, maxLength: 3 },
      { name: 'step_order', label: 'Orden del paso (entero positivo)', type: 'number', required: true },
      { name: 'approver_role_id', label: 'ID de Rol Aprobador', type: 'number', required: true },
      { name: 'department_id', label: 'ID de Departamento (vacío = global)', type: 'number', required: false },
      { name: 'valid_from', label: 'Vigente desde (YYYY-MM-DD)', type: 'date', required: false },
      { name: 'valid_to', label: 'Vigente hasta (YYYY-MM-DD)', type: 'date', required: false },
      { name: 'is_active', label: 'Regla activa', type: 'boolean', defaultValue: true },
      { name: 'description', label: 'Descripción', type: 'textarea', required: false },
    ],
  },
  units_of_measure: {
    label: 'Unidades de Medida',
    group: 'Catálogo e Inventario',
    primaryKey: 'unit_id',
    canCreate: true,
    canDelete: true,
    editableFields: ['name'],
    createFields: [
      { name: 'code', label: 'Código (ej. UN, KG, M)', type: 'text', required: true, maxLength: 20 },
      { name: 'name', label: 'Nombre de la unidad', type: 'text', required: true, maxLength: 80 },
      { name: 'allows_decimal', label: 'Permite cantidades fraccionarias', type: 'boolean', defaultValue: false },
    ],
  },
  products: {
    label: 'Productos',
    group: 'Catálogo e Inventario',
    primaryKey: 'product_id',
    canCreate: true,
    canDelete: false,
    editableFields: ['name', 'description', 'brand', 'model', 'status'],
    createFields: [
      { name: 'sku', label: 'SKU interno', type: 'text', required: true, maxLength: 60 },
      { name: 'barcode', label: 'Código de barras (opcional)', type: 'text', required: false, maxLength: 80 },
      { name: 'name', label: 'Nombre del producto', type: 'text', required: true, maxLength: 180 },
      { name: 'description', label: 'Descripción técnica', type: 'textarea', required: false },
      { name: 'brand', label: 'Marca', type: 'text', required: false, maxLength: 100 },
      { name: 'model', label: 'Modelo', type: 'text', required: false, maxLength: 100 },
      { name: 'unit_id', label: 'ID Unidad de Medida base', type: 'number', required: true },
      { name: 'category_id', label: 'ID Categoría', type: 'number', required: true },
      { name: 'is_stockable', label: 'Producto inventariable', type: 'boolean', defaultValue: true },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  product_identifiers: {
    label: 'Identificadores de Producto',
    group: 'Catálogo e Inventario',
    primaryKey: 'identifier_id',
    canCreate: true,
    canDelete: true,
    editableFields: [],
    createFields: [
      { name: 'product_id', label: 'ID de Producto', type: 'number', required: true },
      { name: 'identifier_type', label: 'Tipo (ej. GTIN, MPN, EAN)', type: 'text', required: true, maxLength: 40 },
      { name: 'identifier_value', label: 'Valor del identificador', type: 'text', required: true, maxLength: 120 },
      { name: 'source_name', label: 'Fuente (opcional)', type: 'text', required: false, maxLength: 100 },
    ],
  },
  warehouses: {
    label: 'Almacenes',
    group: 'Catálogo e Inventario',
    primaryKey: 'warehouse_id',
    canCreate: true,
    canDelete: true,
    editableFields: ['name', 'address', 'status'],
    createFields: [
      { name: 'code', label: 'Código de almacén', type: 'text', required: true, maxLength: 30 },
      { name: 'name', label: 'Nombre del almacén', type: 'text', required: true, maxLength: 120 },
      { name: 'address', label: 'Dirección física', type: 'textarea', required: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  product_warehouse_policies: {
    label: 'Políticas de Stock y Reorden',
    group: 'Catálogo e Inventario',
    primaryKey: 'product_warehouse_policy_id',
    canCreate: true,
    canDelete: false,
    editableFields: [],
    createFields: [
      { name: 'product_id', label: 'ID de Producto', type: 'number', required: true },
      { name: 'warehouse_id', label: 'ID de Almacén', type: 'number', required: true },
      { name: 'minimum_stock', label: 'Stock mínimo (3 decimales)', type: 'decimal', defaultValue: '0.000', required: true },
      { name: 'safety_stock', label: 'Stock de seguridad (3 decimales)', type: 'decimal', defaultValue: '0.000', required: true },
      { name: 'reorder_point', label: 'Punto de reorden configurado (3 decimales)', type: 'decimal', defaultValue: '0.000', required: true },
      { name: 'target_stock', label: 'Stock objetivo (opcional, 3 decimales)', type: 'decimal', required: false },
      { name: 'average_daily_demand', label: 'Demanda diaria promedio (4 decimales)', type: 'decimal', required: false },
      { name: 'lead_time_days', label: 'Plazo de entrega en días (entero)', type: 'number', required: false },
      { name: 'review_period_days', label: 'Periodo de revisión en días', type: 'number', required: false },
      { name: 'calculation_method', label: 'Método de cálculo', type: 'text', required: false, maxLength: 80 },
    ],
  },
  suppliers: {
    label: 'Proveedores',
    group: 'Proveedores y Precios',
    primaryKey: 'supplier_id',
    canCreate: true,
    canDelete: false,
    editableFields: ['trade_name', 'email', 'phone', 'website', 'address', 'status'],
    createFields: [
      { name: 'supplier_code', label: 'Código de proveedor', type: 'text', required: true, maxLength: 40 },
      { name: 'legal_name', label: 'Razón social', type: 'text', required: true, maxLength: 180 },
      { name: 'trade_name', label: 'Nombre comercial', type: 'text', required: false, maxLength: 180 },
      { name: 'tax_id', label: 'Identificación tributaria', type: 'text', required: false, maxLength: 50 },
      { name: 'default_currency_code', label: 'Moneda predeterminada (3 letras)', type: 'text', required: true, maxLength: 3 },
      { name: 'payment_terms_days', label: 'Plazo de pago (días)', type: 'number', defaultValue: 0, required: true },
      { name: 'email', label: 'Correo electrónico', type: 'text', required: false, maxLength: 180 },
      { name: 'phone', label: 'Teléfono', type: 'text', required: false, maxLength: 40 },
      { name: 'website', label: 'Sitio web', type: 'text', required: false, maxLength: 255 },
      { name: 'address', label: 'Dirección', type: 'textarea', required: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  supplier_contacts: {
    label: 'Contactos de Proveedor',
    group: 'Proveedores y Precios',
    primaryKey: 'contact_id',
    canCreate: true,
    canDelete: true,
    editableFields: ['full_name', 'email', 'phone', 'role_title', 'is_primary', 'status'],
    createFields: [
      { name: 'supplier_id', label: 'ID de Proveedor', type: 'number', required: true },
      { name: 'full_name', label: 'Nombre completo', type: 'text', required: true, maxLength: 160 },
      { name: 'role_title', label: 'Cargo / Rol', type: 'text', required: false, maxLength: 100 },
      { name: 'email', label: 'Correo electrónico', type: 'text', required: false, maxLength: 180 },
      { name: 'phone', label: 'Teléfono', type: 'text', required: false, maxLength: 40 },
      { name: 'is_primary', label: 'Contacto principal', type: 'boolean', defaultValue: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  supplier_products: {
    label: 'Productos Equivalentes por Proveedor',
    group: 'Proveedores y Precios',
    primaryKey: 'supplier_product_id',
    canCreate: true,
    canDelete: false,
    editableFields: ['status'],
    createFields: [
      { name: 'supplier_id', label: 'ID de Proveedor', type: 'number', required: true },
      { name: 'product_id', label: 'ID de Producto interno', type: 'number', required: true },
      { name: 'supplier_sku', label: 'SKU del proveedor', type: 'text', required: false, maxLength: 80 },
      { name: 'supplier_product_name', label: 'Nombre en catálogo del proveedor', type: 'text', required: true, maxLength: 200 },
      { name: 'purchase_unit_id', label: 'ID Unidad de compra (circuito exige igual a unidad base)', type: 'number', required: true },
      { name: 'pack_quantity', label: 'Cantidad por empaque (circuito exige 1.000)', type: 'decimal', defaultValue: '1.000', required: true },
      { name: 'currency_code', label: 'Moneda (3 letras)', type: 'text', required: true, maxLength: 3 },
      { name: 'minimum_order_quantity', label: 'Cantidad mínima de orden (opcional)', type: 'decimal', required: false },
      { name: 'lead_time_days', label: 'Plazo de entrega en días (opcional)', type: 'number', required: false },
      { name: 'is_preferred', label: 'Proveedor preferido', type: 'boolean', defaultValue: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  price_sources: {
    label: 'Fuentes de Observación de Precios',
    group: 'Proveedores y Precios',
    primaryKey: 'price_source_id',
    canCreate: true,
    canDelete: false,
    editableFields: ['status'],
    createFields: [
      { name: 'source_name', label: 'Nombre de la fuente autorizada', type: 'text', required: true, maxLength: 120 },
      { name: 'source_type', label: 'Tipo de fuente (ej. cotizacion, lista_oficial, factura)', type: 'text', required: true, maxLength: 40 },
      { name: 'base_url', label: 'URL base (opcional)', type: 'text', required: false, maxLength: 255 },
      { name: 'update_frequency', label: 'Frecuencia de actualización (opcional)', type: 'text', required: false, maxLength: 60 },
      { name: 'notes', label: 'Notas de procedencia y autorización', type: 'textarea', required: false },
      { name: 'status', label: 'Estado', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', required: true },
    ],
  },
  evaluation_criteria: {
    label: 'Criterios de Evaluación de Proveedores',
    group: 'Proveedores y Precios',
    primaryKey: 'criterion_id',
    canCreate: true,
    canDelete: false,
    editableFields: [],
    createFields: [
      { name: 'name', label: 'Nombre del criterio', type: 'text', required: true, maxLength: 100 },
      { name: 'default_weight', label: 'Peso predeterminado (4 decimales, ej. 0.2500)', type: 'decimal', required: true },
      { name: 'higher_is_better', label: 'Mayor puntaje es mejor', type: 'boolean', defaultValue: true },
      { name: 'is_active', label: 'Criterio activo', type: 'boolean', defaultValue: true },
      { name: 'description', label: 'Descripción', type: 'textarea', required: false },
    ],
  },
  roles: {
    label: 'Roles del Sistema (Solo lectura)',
    group: 'Seguridad y Acceso (Lectura)',
    primaryKey: 'role_id',
    canCreate: false,
    canDelete: false,
    editableFields: [],
    createFields: [],
  },
  users: {
    label: 'Usuarios Registrados (Solo lectura)',
    group: 'Seguridad y Acceso (Lectura)',
    primaryKey: 'user_id',
    canCreate: false,
    canDelete: false,
    editableFields: [],
    createFields: [],
  },
  supplier_evaluations: {
    label: 'Cabeceras de Evaluación (Solo lectura)',
    group: 'Seguridad y Acceso (Lectura)',
    primaryKey: 'evaluation_id',
    canCreate: false,
    canDelete: false,
    editableFields: [],
    createFields: [],
  },
};

export async function listAdminResource(resource, token, { page = 1, limit = 50, ...filters } = {}, options = {}) {
  const qs = buildQueryString({ page, limit, ...filters });
  return apiRequest(`/${encodeURIComponent(resource)}${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function getAdminResourceItem(resource, keyValue, token, options = {}) {
  return apiRequest(`/${encodeURIComponent(resource)}/${encodeURIComponent(keyValue)}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function createAdminResourceItem(resource, payload, token, options = {}) {
  return apiRequest(`/${encodeURIComponent(resource)}`, {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function updateAdminResourceItem(resource, keyValue, payload, token, options = {}) {
  const policy = MASTER_RESOURCES_POLICY[resource];
  const allowed = policy?.editableFields || [];
  const filteredBody = {};
  for (const field of allowed) {
    if (payload[field] !== undefined) {
      filteredBody[field] = payload[field];
    }
  }
  return apiRequest(`/${encodeURIComponent(resource)}/${encodeURIComponent(keyValue)}`, {
    method: 'PATCH',
    token,
    body: filteredBody,
    ...options,
  });
}

export async function deleteAdminResourceItem(resource, keyValue, token, options = {}) {
  return apiRequest(`/${encodeURIComponent(resource)}/${encodeURIComponent(keyValue)}`, {
    method: 'DELETE',
    token,
    ...options,
  });
}

export async function importPriceObservationsBatch(payload, token, options = {}) {
  return apiRequest('/admin/price-imports', {
    method: 'POST',
    token,
    body: payload,
    ...options,
  });
}

export async function listPriceImportBatches(token, { page = 1, limit = 25 } = {}, options = {}) {
  const qs = buildQueryString({ page, limit });
  return apiRequest(`/price_import_batches${qs}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export async function getPriceImportBatchDetail(batchId, token, options = {}) {
  return apiRequest(`/price_import_batches/${encodeURIComponent(batchId)}`, {
    method: 'GET',
    token,
    ...options,
  });
}

export function parseImportBatchErrorSummary(errorSummaryText) {
  if (!errorSummaryText) {
    return { version: null, price_basis: null, availability_basis: null, errors: [] };
  }
  try {
    const parsed = JSON.parse(errorSummaryText);
    if (Array.isArray(parsed)) {
      return { version: null, price_basis: null, availability_basis: null, errors: parsed };
    }
    return {
      version: parsed.version ?? null,
      price_basis: parsed.price_basis ?? null,
      availability_basis: parsed.availability_basis ?? null,
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
    };
  } catch {
    return { version: null, price_basis: null, availability_basis: null, errors: [] };
  }
}
