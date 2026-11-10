Project clavos_compras_inventario {
  database_type: 'MySQL'
  Note: 'Modelo relacional para compras, comparación de proveedores, inventario y análisis de gasto de Ferretería Clavos.'
}

Enum record_status {
  active
  inactive
}

Enum requisition_status {
  draft
  submitted
  under_review
  approved
  rejected
  cancelled
  partially_ordered
  ordered
  closed
}

Enum approval_status {
  pending
  approved
  rejected
  skipped
}

Enum purchase_order_status {
  draft
  sent
  acknowledged
  partially_received
  received
  cancelled
  closed
}

Enum receipt_status {
  draft
  posted
  cancelled
}

Enum invoice_status {
  received
  under_review
  matched
  disputed
  approved
  partially_paid
  paid
  cancelled
}

Enum payment_status {
  scheduled
  processing
  completed
  failed
  cancelled
}

Enum inventory_movement_type {
  receipt
  sale
  return
  transfer_in
  transfer_out
  adjustment_in
  adjustment_out
  reservation
  release
  damage
  stock_count
}

Enum anomaly_type {
  duplicate_purchase
  duplicate_invoice
  off_contract
  overprice
  unusual_quantity
  split_purchase
}

Enum anomaly_status {
  open
  under_review
  confirmed
  dismissed
  resolved
}

Enum comparison_status {
  draft
  completed
  cancelled
}

Enum evaluation_status {
  draft
  submitted
  approved
  rejected
}


// ─────────────────────────────────────────────
// Organización, usuarios y permisos
// ─────────────────────────────────────────────

Table departments {
  department_id int [pk, increment]
  name varchar(120) [not null, unique]
  description text
  status record_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]
}

Table cost_centers {
  cost_center_id int [pk, increment]
  code varchar(30) [not null, unique]
  name varchar(120) [not null]
  department_id int [not null]
  status record_status [not null, default: 'active']
}

Table users {
  user_id int [pk, increment]
  department_id int
  full_name varchar(160) [not null]
  email varchar(180) [not null, unique]
  job_title varchar(120)
  status record_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]
}

Table roles {
  role_id int [pk, increment]
  name varchar(80) [not null, unique]
  description text
}

Table user_roles {
  user_id int [not null]
  role_id int [not null]
  assigned_at timestamp [not null, default: `now()`]

  indexes {
    (user_id, role_id) [pk]
  }
}


// ─────────────────────────────────────────────
// Monedas, unidades, productos y categorías
// ─────────────────────────────────────────────

Table currencies {
  currency_code char(3) [pk, note: 'Código ISO 4217; por ejemplo CRC, USD.']
  name varchar(60) [not null]
  symbol varchar(8)
  decimal_places int [not null, default: 2]
  status record_status [not null, default: 'active']
}

Table units_of_measure {
  unit_id int [pk, increment]
  code varchar(20) [not null, unique, note: 'Ejemplo: UN, KG, M, L, CAJA.']
  name varchar(80) [not null]
  allows_decimal boolean [not null, default: false]
}

Table expense_categories {
  category_id int [pk, increment]
  parent_category_id int
  code varchar(40) [not null, unique]
  name varchar(120) [not null]
  description text
  is_capital_expense boolean [not null, default: false]
  status record_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]

  Note: 'Taxonomía jerárquica de gastos. Cada línea de compra debe tener una categoría para poder comparar gastos de forma consistente.'
}

Table products {
  product_id int [pk, increment]
  sku varchar(60) [not null, unique]
  barcode varchar(80) [unique]
  name varchar(180) [not null]
  description text
  brand varchar(100)
  model varchar(100)
  unit_id int [not null]
  category_id int [not null]
  is_stockable boolean [not null, default: true]
  status record_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp
}

Table product_identifiers {
  identifier_id int [pk, increment]
  product_id int [not null]
  identifier_type varchar(40) [not null, note: 'GTIN, código del fabricante, SKU de proveedor u otro.']
  identifier_value varchar(120) [not null]
  source_name varchar(100)

  indexes {
    (identifier_type, identifier_value) [unique]
  }
}


// ─────────────────────────────────────────────
// Proveedores y precios externos
// ─────────────────────────────────────────────

Table suppliers {
  supplier_id int [pk, increment]
  supplier_code varchar(40) [not null, unique]
  legal_name varchar(180) [not null]
  trade_name varchar(180)
  tax_id varchar(50)
  email varchar(180)
  phone varchar(40)
  website varchar(255)
  address text
  default_currency_code char(3) [not null]
  payment_terms_days int [not null, default: 0]
  status record_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]
}

Table supplier_contacts {
  contact_id int [pk, increment]
  supplier_id int [not null]
  full_name varchar(160) [not null]
  email varchar(180)
  phone varchar(40)
  role_title varchar(100)
  is_primary boolean [not null, default: false]
  status record_status [not null, default: 'active']
}

Table supplier_products {
  supplier_product_id int [pk, increment]
  supplier_id int [not null]
  product_id int [not null]
  supplier_sku varchar(100)
  supplier_product_name varchar(180)
  pack_quantity decimal(12,3) [not null, default: 1]
  purchase_unit_id int [not null]
  minimum_order_quantity decimal(12,3)
  lead_time_days int
  last_known_price decimal(14,4)
  currency_code char(3) [not null]
  is_preferred boolean [not null, default: false]
  status record_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]

  indexes {
    (supplier_id, product_id) [unique]
    (supplier_id, supplier_sku)
  }
}

Table price_sources {
  price_source_id int [pk, increment]
  source_name varchar(120) [not null, unique, note: 'Ejemplo: EPA, archivo CSV, API del proveedor.']
  source_type varchar(40) [not null, note: 'API, web, archivo, manual.']
  base_url varchar(255)
  update_frequency varchar(60)
  status record_status [not null, default: 'active']
  notes text
}

Table price_import_batches {
  import_batch_id int [pk, increment]
  price_source_id int [not null]
  started_at timestamp [not null, default: `now()`]
  completed_at timestamp
  imported_by_user_id int
  records_received int [not null, default: 0]
  records_imported int [not null, default: 0]
  records_rejected int [not null, default: 0]
  status varchar(30) [not null, note: 'Ejemplo: running, completed, failed.']
  error_summary text
}

Table supplier_price_observations {
  price_observation_id int [pk, increment]
  supplier_product_id int [not null]
  price_source_id int [not null]
  import_batch_id int
  observed_at timestamp [not null, default: `now()`]
  unit_price decimal(14,4) [not null]
  currency_code char(3) [not null]
  price_includes_tax boolean [not null, default: false]
  available_quantity decimal(14,3)
  source_product_url varchar(500)
  external_reference varchar(150)
  is_validated boolean [not null, default: false]

  Note: 'Conserva el historial de precios observados. Permite ver la evolución y comparar precios del mismo producto entre proveedores.'
}


// ─────────────────────────────────────────────
// Contratos y condiciones acordadas
// ─────────────────────────────────────────────

Table contracts {
  contract_id int [pk, increment]
  supplier_id int [not null]
  contract_number varchar(80) [not null, unique]
  title varchar(180) [not null]
  start_date date [not null]
  end_date date
  currency_code char(3) [not null]
  status varchar(30) [not null, note: 'Ejemplo: draft, active, expired, terminated.']
  document_url varchar(500)
  created_by_user_id int
  created_at timestamp [not null, default: `now()`]
}

Table contract_lines {
  contract_line_id int [pk, increment]
  contract_id int [not null]
  product_id int [not null]
  agreed_unit_price decimal(14,4) [not null]
  currency_code char(3) [not null]
  minimum_quantity decimal(14,3)
  maximum_quantity decimal(14,3)
  unit_id int [not null]
  notes text

  indexes {
    (contract_id, product_id) [unique]
  }
}


// ─────────────────────────────────────────────
// Requisición, aprobación y políticas por monto
// ─────────────────────────────────────────────

Table approval_rules {
  approval_rule_id int [pk, increment]
  rule_name varchar(120) [not null]
  min_amount decimal(14,2) [not null, default: 0]
  max_amount decimal(14,2)
  currency_code char(3) [not null]
  step_order int [not null, note: 'Orden de aprobación dentro del circuito.']
  approver_role_id int [not null]
  department_id int
  is_active boolean [not null, default: true]
  valid_from date
  valid_to date
  description text

  Note: 'Configura quién debe aprobar cada paso según el monto, moneda y, opcionalmente, departamento. Los rangos deben definirse sin solapamientos no deseados.'
}

Table requisitions {
  requisition_id int [pk, increment]
  requisition_number varchar(40) [not null, unique]
  requester_user_id int [not null]
  department_id int [not null]
  cost_center_id int [not null]
  requested_at timestamp [not null, default: `now()`]
  needed_by_date date
  currency_code char(3) [not null]
  estimated_total decimal(14,2) [not null, default: 0]
  business_justification text [not null]
  status requisition_status [not null, default: 'draft']
  submitted_at timestamp
  closed_at timestamp
  notes text
}

Table requisition_lines {
  requisition_line_id int [pk, increment]
  requisition_id int [not null]
  product_id int [not null]
  category_id int [not null]
  quantity_requested decimal(14,3) [not null]
  unit_id int [not null]
  estimated_unit_price decimal(14,4)
  currency_code char(3) [not null]
  preferred_supplier_id int
  needed_by_date date
  specification text
  created_at timestamp [not null, default: `now()`]
}

Table requisition_approvals {
  requisition_approval_id int [pk, increment]
  requisition_id int [not null]
  approval_rule_id int [not null]
  step_order int [not null]
  approver_user_id int
  status approval_status [not null, default: 'pending']
  assigned_at timestamp [not null, default: `now()`]
  decided_at timestamp
  comments text

  indexes {
    (requisition_id, step_order) [unique]
  }
}


// ─────────────────────────────────────────────
// Comparación de ofertas y órdenes de compra
// ─────────────────────────────────────────────

Table price_comparisons {
  comparison_id int [pk, increment]
  comparison_number varchar(40) [not null, unique]
  requisition_id int
  created_by_user_id int [not null]
  created_at timestamp [not null, default: `now()`]
  status comparison_status [not null, default: 'draft']
  currency_code char(3) [not null]
  notes text

  Note: 'Cada comparación conserva una fotografía de las ofertas consideradas para justificar la selección de proveedor.'
}

Table price_comparison_items {
  comparison_item_id int [pk, increment]
  comparison_id int [not null]
  product_id int [not null]
  supplier_id int [not null]
  supplier_product_id int
  price_observation_id int
  quoted_unit_price decimal(14,4) [not null]
  currency_code char(3) [not null]
  quantity_quoted decimal(14,3) [not null]
  lead_time_days int
  quality_note text
  payment_terms_days int
  is_selected boolean [not null, default: false]
  selection_reason text
}

Table purchase_orders {
  purchase_order_id int [pk, increment]
  po_number varchar(40) [not null, unique]
  supplier_id int [not null]
  requisition_id int
  contract_id int
  comparison_id int
  created_by_user_id int [not null]
  approved_by_user_id int
  ordered_at timestamp
  expected_delivery_date date
  currency_code char(3) [not null]
  subtotal decimal(14,2) [not null, default: 0]
  tax_total decimal(14,2) [not null, default: 0]
  total_amount decimal(14,2) [not null, default: 0]
  status purchase_order_status [not null, default: 'draft']
  supplier_reference varchar(100)
  notes text
}

Table purchase_order_lines {
  purchase_order_line_id int [pk, increment]
  purchase_order_id int [not null]
  product_id int [not null]
  contract_line_id int
  supplier_product_id int
  description varchar(250)
  quantity_ordered decimal(14,3) [not null]
  unit_id int [not null]
  unit_price decimal(14,4) [not null]
  tax_rate decimal(7,4) [not null, default: 0]
  line_total decimal(14,2) [not null]
  category_id int [not null]
  expected_delivery_date date
}

Table requisition_order_allocations {
  allocation_id int [pk, increment]
  requisition_line_id int [not null]
  purchase_order_line_id int [not null]
  quantity_allocated decimal(14,3) [not null]

  indexes {
    (requisition_line_id, purchase_order_line_id) [unique]
  }

  Note: 'Permite convertir una requisición en varias órdenes o consolidar líneas, conservando cuánto de cada línea fue ordenado.'
}


// ─────────────────────────────────────────────
// Recepción, factura y pago
// ─────────────────────────────────────────────

Table receipts {
  receipt_id int [pk, increment]
  receipt_number varchar(40) [not null, unique]
  purchase_order_id int [not null]
  received_by_user_id int [not null]
  received_at timestamp [not null, default: `now()`]
  status receipt_status [not null, default: 'draft']
  delivery_note_number varchar(100)
  notes text
}

Table receipt_lines {
  receipt_line_id int [pk, increment]
  receipt_id int [not null]
  purchase_order_line_id int [not null]
  quantity_received decimal(14,3) [not null]
  quantity_accepted decimal(14,3) [not null]
  quantity_rejected decimal(14,3) [not null, default: 0]
  rejection_reason text
  lot_number varchar(100)
  expiration_date date
}

Table supplier_invoices {
  invoice_id int [pk, increment]
  supplier_id int [not null]
  purchase_order_id int
  invoice_number varchar(100) [not null]
  invoice_date date [not null]
  due_date date
  received_at timestamp [not null, default: `now()`]
  currency_code char(3) [not null]
  subtotal decimal(14,2) [not null]
  tax_total decimal(14,2) [not null, default: 0]
  total_amount decimal(14,2) [not null]
  status invoice_status [not null, default: 'received']
  document_url varchar(500)
  reviewed_by_user_id int
  notes text

  indexes {
    (supplier_id, invoice_number) [unique]
  }
}

Table invoice_lines {
  invoice_line_id int [pk, increment]
  invoice_id int [not null]
  purchase_order_line_id int
  product_id int
  description varchar(250) [not null]
  quantity_invoiced decimal(14,3) [not null]
  unit_id int
  unit_price decimal(14,4) [not null]
  tax_rate decimal(7,4) [not null, default: 0]
  line_total decimal(14,2) [not null]
  category_id int
}

Table invoice_receipt_allocations {
  invoice_receipt_allocation_id int [pk, increment]
  invoice_line_id int [not null]
  receipt_line_id int [not null]
  quantity_matched decimal(14,3) [not null]

  indexes {
    (invoice_line_id, receipt_line_id) [unique]
  }

  Note: 'Relaciona cantidades facturadas con cantidades efectivamente recibidas para la conciliación de tres vías: orden, recepción y factura.'
}

Table payments {
  payment_id int [pk, increment]
  payment_reference varchar(100) [unique]
  payment_date date
  currency_code char(3) [not null]
  amount decimal(14,2) [not null]
  payment_method varchar(40)
  status payment_status [not null, default: 'scheduled']
  created_by_user_id int
  confirmed_by_user_id int
  bank_reference varchar(120)
  notes text
}

Table payment_allocations {
  payment_allocation_id int [pk, increment]
  payment_id int [not null]
  invoice_id int [not null]
  amount_applied decimal(14,2) [not null]

  indexes {
    (payment_id, invoice_id) [unique]
  }
}


// ─────────────────────────────────────────────
// Almacenes, políticas de stock y movimientos
// ─────────────────────────────────────────────

Table warehouses {
  warehouse_id int [pk, increment]
  code varchar(30) [not null, unique]
  name varchar(120) [not null]
  address text
  status record_status [not null, default: 'active']
}

Table product_warehouse_policies {
  product_warehouse_policy_id int [pk, increment]
  product_id int [not null]
  warehouse_id int [not null]
  minimum_stock decimal(14,3) [not null, default: 0]
  safety_stock decimal(14,3) [not null, default: 0]
  reorder_point decimal(14,3) [not null, default: 0]
  target_stock decimal(14,3)
  average_daily_demand decimal(14,4)
  lead_time_days int
  review_period_days int
  last_calculated_at timestamp
  calculation_method varchar(80)

  indexes {
    (product_id, warehouse_id) [unique]
  }

  Note: 'El punto de reorden puede calcularse como demanda diaria promedio × plazo de entrega + stock de seguridad.'
}

Table stock_lots {
  lot_id int [pk, increment]
  product_id int [not null]
  warehouse_id int [not null]
  lot_number varchar(100) [not null]
  received_at timestamp
  expiration_date date
  unit_cost decimal(14,4)
  currency_code char(3)
  status varchar(30) [not null, default: 'available']

  indexes {
    (product_id, warehouse_id, lot_number) [unique]
  }
}

Table inventory_movements {
  inventory_movement_id int [pk, increment]
  movement_number varchar(40) [not null, unique]
  movement_type inventory_movement_type [not null]
  movement_at timestamp [not null, default: `now()`]
  created_by_user_id int [not null]
  reference_type varchar(40) [note: 'Ejemplo: receipt, sale, transfer, stock_count.']
  reference_id int [note: 'Identificador del documento de origen.']
  notes text
}

Table inventory_movement_lines {
  inventory_movement_line_id int [pk, increment]
  inventory_movement_id int [not null]
  product_id int [not null]
  warehouse_id int [not null]
  lot_id int
  quantity_change decimal(14,3) [not null, note: 'Positivo para entradas y negativo para salidas.']
  unit_cost decimal(14,4)
  currency_code char(3)
  receipt_line_id int
  notes text
}

Table stock_reservations {
  reservation_id int [pk, increment]
  product_id int [not null]
  warehouse_id int [not null]
  quantity_reserved decimal(14,3) [not null]
  reserved_at timestamp [not null, default: `now()`]
  expires_at timestamp
  reference_type varchar(40)
  reference_id int
  released_at timestamp
  created_by_user_id int [not null]
  notes text
}


// ─────────────────────────────────────────────
// Evaluación ponderada de proveedores
// ─────────────────────────────────────────────

Table evaluation_criteria {
  criterion_id int [pk, increment]
  name varchar(100) [not null, unique, note: 'Precio, calidad, plazo, servicio, condiciones de pago, riesgo u otro criterio.']
  description text
  default_weight decimal(7,4) [not null]
  higher_is_better boolean [not null, default: true]
  is_active boolean [not null, default: true]
}

Table supplier_evaluations {
  evaluation_id int [pk, increment]
  supplier_id int [not null]
  evaluation_period_start date
  evaluation_period_end date
  evaluated_by_user_id int [not null]
  evaluated_at timestamp [not null, default: `now()`]
  status evaluation_status [not null, default: 'draft']
  total_weighted_score decimal(8,4)
  recommendation text
}

Table supplier_evaluation_scores {
  evaluation_score_id int [pk, increment]
  evaluation_id int [not null]
  criterion_id int [not null]
  weight_used decimal(7,4) [not null]
  score decimal(7,4) [not null, note: 'Escala definida por Clavos, por ejemplo de 1 a 5.']
  weighted_score decimal(8,4) [not null]
  evidence text

  indexes {
    (evaluation_id, criterion_id) [unique]
  }
}


// ─────────────────────────────────────────────
// Hallazgos del análisis de gasto
// ─────────────────────────────────────────────

Table spend_anomalies {
  anomaly_id int [pk, increment]
  anomaly_type anomaly_type [not null]
  status anomaly_status [not null, default: 'open']
  detected_at timestamp [not null, default: `now()`]
  detected_by varchar(40) [not null, note: 'Regla automática, análisis manual o proceso externo.']
  supplier_id int
  product_id int
  category_id int
  requisition_id int
  purchase_order_id int
  invoice_id int
  related_invoice_id int [note: 'Factura posiblemente duplicada.']
  benchmark_price decimal(14,4)
  observed_price decimal(14,4)
  currency_code char(3)
  variance_percent decimal(9,4)
  explanation text [not null]
  reviewed_by_user_id int
  reviewed_at timestamp
  resolution_notes text
}

Table spend_analysis_runs {
  analysis_run_id int [pk, increment]
  started_at timestamp [not null, default: `now()`]
  completed_at timestamp
  created_by_user_id int
  date_from date [not null]
  date_to date [not null]
  rules_version varchar(40)
  anomalies_found int [not null, default: 0]
  status varchar(30) [not null, note: 'Ejemplo: running, completed, failed.']
  summary text
}


// ─────────────────────────────────────────────
// Relaciones
// ─────────────────────────────────────────────

Ref: cost_centers.department_id > departments.department_id
Ref: users.department_id > departments.department_id
Ref: user_roles.user_id > users.user_id
Ref: user_roles.role_id > roles.role_id

Ref: products.unit_id > units_of_measure.unit_id
Ref: products.category_id > expense_categories.category_id
Ref: expense_categories.parent_category_id > expense_categories.category_id
Ref: product_identifiers.product_id > products.product_id

Ref: suppliers.default_currency_code > currencies.currency_code
Ref: supplier_contacts.supplier_id > suppliers.supplier_id
Ref: supplier_products.supplier_id > suppliers.supplier_id
Ref: supplier_products.product_id > products.product_id
Ref: supplier_products.purchase_unit_id > units_of_measure.unit_id
Ref: supplier_products.currency_code > currencies.currency_code

Ref: price_import_batches.price_source_id > price_sources.price_source_id
Ref: price_import_batches.imported_by_user_id > users.user_id
Ref: supplier_price_observations.supplier_product_id > supplier_products.supplier_product_id
Ref: supplier_price_observations.price_source_id > price_sources.price_source_id
Ref: supplier_price_observations.import_batch_id > price_import_batches.import_batch_id
Ref: supplier_price_observations.currency_code > currencies.currency_code

Ref: contracts.supplier_id > suppliers.supplier_id
Ref: contracts.currency_code > currencies.currency_code
Ref: contracts.created_by_user_id > users.user_id
Ref: contract_lines.contract_id > contracts.contract_id
Ref: contract_lines.product_id > products.product_id
Ref: contract_lines.unit_id > units_of_measure.unit_id
Ref: contract_lines.currency_code > currencies.currency_code

Ref: approval_rules.approver_role_id > roles.role_id
Ref: approval_rules.department_id > departments.department_id
Ref: approval_rules.currency_code > currencies.currency_code

Ref: requisitions.requester_user_id > users.user_id
Ref: requisitions.department_id > departments.department_id
Ref: requisitions.cost_center_id > cost_centers.cost_center_id
Ref: requisitions.currency_code > currencies.currency_code
Ref: requisition_lines.requisition_id > requisitions.requisition_id
Ref: requisition_lines.product_id > products.product_id
Ref: requisition_lines.category_id > expense_categories.category_id
Ref: requisition_lines.unit_id > units_of_measure.unit_id
Ref: requisition_lines.preferred_supplier_id > suppliers.supplier_id
Ref: requisition_lines.currency_code > currencies.currency_code
Ref: requisition_approvals.requisition_id > requisitions.requisition_id
Ref: requisition_approvals.approval_rule_id > approval_rules.approval_rule_id
Ref: requisition_approvals.approver_user_id > users.user_id

Ref: price_comparisons.requisition_id > requisitions.requisition_id
Ref: price_comparisons.created_by_user_id > users.user_id
Ref: price_comparisons.currency_code > currencies.currency_code
Ref: price_comparison_items.comparison_id > price_comparisons.comparison_id
Ref: price_comparison_items.product_id > products.product_id
Ref: price_comparison_items.supplier_id > suppliers.supplier_id
Ref: price_comparison_items.supplier_product_id > supplier_products.supplier_product_id
Ref: price_comparison_items.price_observation_id > supplier_price_observations.price_observation_id
Ref: price_comparison_items.currency_code > currencies.currency_code

Ref: purchase_orders.supplier_id > suppliers.supplier_id
Ref: purchase_orders.requisition_id > requisitions.requisition_id
Ref: purchase_orders.contract_id > contracts.contract_id
Ref: purchase_orders.comparison_id > price_comparisons.comparison_id
Ref: purchase_orders.created_by_user_id > users.user_id
Ref: purchase_orders.approved_by_user_id > users.user_id
Ref: purchase_orders.currency_code > currencies.currency_code
Ref: purchase_order_lines.purchase_order_id > purchase_orders.purchase_order_id
Ref: purchase_order_lines.product_id > products.product_id
Ref: purchase_order_lines.contract_line_id > contract_lines.contract_line_id
Ref: purchase_order_lines.supplier_product_id > supplier_products.supplier_product_id
Ref: purchase_order_lines.unit_id > units_of_measure.unit_id
Ref: purchase_order_lines.category_id > expense_categories.category_id
Ref: requisition_order_allocations.requisition_line_id > requisition_lines.requisition_line_id
Ref: requisition_order_allocations.purchase_order_line_id > purchase_order_lines.purchase_order_line_id

Ref: receipts.purchase_order_id > purchase_orders.purchase_order_id
Ref: receipts.received_by_user_id > users.user_id
Ref: receipt_lines.receipt_id > receipts.receipt_id
Ref: receipt_lines.purchase_order_line_id > purchase_order_lines.purchase_order_line_id

Ref: supplier_invoices.supplier_id > suppliers.supplier_id
Ref: supplier_invoices.purchase_order_id > purchase_orders.purchase_order_id
Ref: supplier_invoices.currency_code > currencies.currency_code
Ref: supplier_invoices.reviewed_by_user_id > users.user_id
Ref: invoice_lines.invoice_id > supplier_invoices.invoice_id
Ref: invoice_lines.purchase_order_line_id > purchase_order_lines.purchase_order_line_id
Ref: invoice_lines.product_id > products.product_id
Ref: invoice_lines.unit_id > units_of_measure.unit_id
Ref: invoice_lines.category_id > expense_categories.category_id
Ref: invoice_receipt_allocations.invoice_line_id > invoice_lines.invoice_line_id
Ref: invoice_receipt_allocations.receipt_line_id > receipt_lines.receipt_line_id
Ref: payments.currency_code > currencies.currency_code
Ref: payments.created_by_user_id > users.user_id
Ref: payments.confirmed_by_user_id > users.user_id
Ref: payment_allocations.payment_id > payments.payment_id
Ref: payment_allocations.invoice_id > supplier_invoices.invoice_id

Ref: product_warehouse_policies.product_id > products.product_id
Ref: product_warehouse_policies.warehouse_id > warehouses.warehouse_id
Ref: stock_lots.product_id > products.product_id
Ref: stock_lots.warehouse_id > warehouses.warehouse_id
Ref: stock_lots.currency_code > currencies.currency_code
Ref: inventory_movements.created_by_user_id > users.user_id
Ref: inventory_movement_lines.inventory_movement_id > inventory_movements.inventory_movement_id
Ref: inventory_movement_lines.product_id > products.product_id
Ref: inventory_movement_lines.warehouse_id > warehouses.warehouse_id
Ref: inventory_movement_lines.lot_id > stock_lots.lot_id
Ref: inventory_movement_lines.receipt_line_id > receipt_lines.receipt_line_id
Ref: inventory_movement_lines.currency_code > currencies.currency_code
Ref: stock_reservations.product_id > products.product_id
Ref: stock_reservations.warehouse_id > warehouses.warehouse_id
Ref: stock_reservations.created_by_user_id > users.user_id

Ref: supplier_evaluations.supplier_id > suppliers.supplier_id
Ref: supplier_evaluations.evaluated_by_user_id > users.user_id
Ref: supplier_evaluation_scores.evaluation_id > supplier_evaluations.evaluation_id
Ref: supplier_evaluation_scores.criterion_id > evaluation_criteria.criterion_id

Ref: spend_anomalies.supplier_id > suppliers.supplier_id
Ref: spend_anomalies.product_id > products.product_id
Ref: spend_anomalies.category_id > expense_categories.category_id
Ref: spend_anomalies.requisition_id > requisitions.requisition_id
Ref: spend_anomalies.purchase_order_id > purchase_orders.purchase_order_id
Ref: spend_anomalies.invoice_id > supplier_invoices.invoice_id
Ref: spend_anomalies.related_invoice_id > supplier_invoices.invoice_id
Ref: spend_anomalies.reviewed_by_user_id > users.user_id
Ref: spend_anomalies.currency_code > currencies.currency_code
Ref: spend_analysis_runs.created_by_user_id > users.user_id

// Extensión de acceso privado: migración aditiva 20261109010000.
// No se asignan contraseñas a usuarios existentes automáticamente.
Table auth_credentials {
  user_id int [pk, not null]
  password_hash varchar(255) [not null, note: 'Derivación scrypt con sal; nunca contraseña en claro.']
  failed_attempts int [not null, default: 0]
  locked_until timestamp
}

Table auth_sessions {
  token_hash char(64) [pk, not null, note: 'SHA-256 del token aleatorio; no el token original.']
  user_id int [not null]
  created_at timestamp [not null]
  expires_at timestamp [not null]
  revoked_at timestamp
}

Ref: auth_credentials.user_id > users.user_id
Ref: auth_sessions.user_id > users.user_id
