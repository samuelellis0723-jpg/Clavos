# Clavos — Mapa de Pantallas y Arquitectura UX (`PLAN_UX.md`)

## 1. Propósito y Alcance Operativo

Este documento establece el mapa de pantallas, flujos de navegación, permisos por rol, contratos de API reales y estados de interfaz (carga, vacío, error y restricciones de negocio) para **Ferretería Clavos**. Toda la arquitectura se rige por el contrato real de `backend/README.md`, `backend/docs/business-decisions.md` y `backend/docs/epa.md`.

### Reglas transversales de integridad y datos
- **Sin precios ni datos ficticios en operación:** Ninguna pantalla muestra precios inventados de EPA ni de otros proveedores, ni cuentas de demostración o contraseñas prellenadas.
- **Vigencia de observaciones:** Toda oferta en comparación pública muestra `is_current_price_guaranteed: false` de forma explícita y visible, junto con su fecha de observación (`observed_at`), antigüedad (`age_seconds`), estado de frescura (`freshness`: `recent_observation`, `stale` o `age_policy_not_configured`) y base de precio (`price_basis`).
- **Comparación estricta por grupo (`comparison_group`):** Nunca se mezclan ni ordenan globalmente ofertas con distinta moneda, unidad de compra, cantidad por empaque (`pack_quantity`) o tratamiento de impuesto (`price_includes_tax`). Las observaciones heredadas con `price_basis: "unconfirmed_legacy_basis"` o `comparison_group: null` se muestran en una sección separada no comparable sin declarar ganador.
- **Aritmética monetaria:** Los montos y cantidades (`DECIMAL` en cadena de texto) se preservan como cadenas exactas al enviarse al servidor y se previsualizan mediante aritmética entera escalada (`BigInt`), nunca con coma flotante (`Number`) para cálculos de facturas u órdenes.
- **Sesión en memoria:** El token opaco (`Bearer <64-hex>`) vive únicamente en memoria de React. Recargar la página o recibir `401 UNAUTHORIZED` limpia la sesión y redirige a `/login`. Ocultar botones en React mejora la experiencia por rol, pero el backend es la única autoridad de seguridad.

---

## 2. Mapa de Pantallas Públicas (Sin Autenticación)

Las pantallas públicas consumen exclusivamente `/api/catalog/*` y no exponen contactos privados de proveedores ni costos internos.

| Ruta React | Pantalla | Endpoints conectados | Estados (Carga / Vacío / Error) y Reglas |
| :--- | :--- | :--- | :--- |
| `/` | **Inicio y Resumen del Sistema** | `GET /api/catalog/categories?page=1&limit=25`<br>`GET /api/catalog/products?page=1&limit=6` | **Carga:** Esqueleto de cuadrícula suiza.<br>**Vacío:** Explicación clara de que el catálogo activo aún no tiene productos publicados y enlace a búsqueda o acceso operativo.<br>**Error:** Mensaje de error HTTP o fallo de conexión (`503` / red) con botón de reintento. |
| `/catalog` | **Catálogo Público de Productos** | `GET /api/catalog/products` (`q`, `category_id`, `unit_id`, `brand`, `page`, `limit`)<br>`GET /api/catalog/categories` (`page`, `limit`) | **Carga:** Esqueleto de tabla/tarjetas respetando dimensiones.<br>**Vacío:** Estado compuesto indicando si no hay coincidencias con los filtros activos (con botón para limpiar filtros) o si el catálogo está vacío.<br>**Error:** Alerta en línea con código (`400 INVALID_PAGINATION`, `503 DATABASE_UNAVAILABLE`, etc.). |
| `/catalog/products/:productId` | **Detalle de Producto y Ficha Técnica** | `GET /api/catalog/products/:product_id` | **Carga:** Esqueleto de ficha técnica.<br>**404:** Pantalla de producto no encontrado o inactivo, con retorno al catálogo.<br>**Acción:** Acceso directo a la vista de comparación de observaciones de precios o vista integrada. |
| `/catalog/products/:productId/comparison` | **Comparación de Observaciones de Precios por Proveedor** | `GET /api/catalog/products/:product_id/comparison` (`page`, `limit`) | **Carga:** Esqueleto de grupos de comparación.<br>**Vacío (`offers: []`):** Indica el total de productos equivalentes registrados (`pagination.total_supplier_products`) y explica que no existen observaciones validadas vigentes para mostrar.<br>**Agrupación:** Separa las ofertas por `comparison_group` (`unidad \| pack_quantity \| moneda \| impuesto`). Las ofertas con `comparison_group: null` (`unconfirmed_legacy_basis`) se listan aparte con advertencia de base no confirmada. Muestra `meta` del contrato (`price_basis`, `ranking: "none"`, `conversion: "none"`, `presentation_policy`, `availability_basis`). |

---

## 3. Mapa de Pantallas Privadas (Operaciones y Administración)

Todas las rutas bajo `/app/*` requieren sesión activa en memoria (`Authorization: Bearer <token>`).

### 3.1 Acceso y Panel Operativo

| Ruta React | Pantalla | Roles en UI | Endpoints conectados | Estados y Reglas de Negocio |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | **Inicio de Sesión Operativo** | Público | `POST /api/auth/login`<br>`GET /api/auth/me` | **Sin cuentas demo:** Informa cómo habilitar cuentas reales mediante CLI (`npm run access:provision`).<br>**Errores:** Maneja `401 INVALID_CREDENTIALS`, `429 TOO_MANY_REQUESTS` (bloqueo temporal o límite por IP) y fallo de red. |
| `/app` | **Panel Operativo por Rol** | Todos los autenticados (`admin`, `requester`, `buyer`, `warehouse`, `finance`, `analyst`, o roles de aprobación) | `GET /api/auth/me`<br>`POST /api/auth/logout` (204) | Muestra identidad actual (`full_name`, `email`, `department_id`, `roles`), accesos rápidos según roles asignados, y recordatorio de sesión en memoria. Permite verificar sesión con `/api/auth/me` y cerrar sesión (`204 No Content`). |

### 3.2 Circuito de Compras, Recepción, Inventario y Finanzas

| Ruta React | Pantalla | Roles permitidos | Endpoints conectados | Estados y Reglas del Circuito |
| :--- | :--- | :--- | :--- | :--- |
| `/app/requisitions` | **Requisiciones (Lista, Creación y Detalle/Envío)** | Lectura: `requester` (propias), `buyer`, `warehouse`, `admin`, o aprobador asignado en detalle.<br>Crear/Enviar: `requester`, `buyer`, `admin` (enviar: solo propietario). | `GET /api/operations/requisitions` (`page`, `limit`, `status`)<br>`POST /api/operations/requisitions`<br>`GET /api/operations/requisitions/:id`<br>`POST /api/operations/requisitions/:id/submit` | **Creación (`201`):** Requiere `requisition_number`, `cost_center_id` (del departamento del solicitante), `currency_code`, `business_justification`, `needed_by_date` opcional y `lines` (`product_id`, `quantity_requested`, `estimated_unit_price`).<br>**Detalle:** Muestra `lines` y `approvals` (`step_order`, `status`, `decided_at`, `comments`).<br>**Envío (`200`):** Solo si está en `draft` y el usuario activo es `requester_user_id`. Maneja `409 APPROVAL_POLICY_MISSING` y `409 APPROVAL_POLICY_AMBIGUOUS`. |
| `/app/approvals` | **Bandeja de Aprobaciones y Decisión** | Cualquier usuario con `role_ids` exigidos por pasos pendientes. | `GET /api/operations/approvals` (`page`, `limit`)<br>`GET /api/operations/requisitions/:id`<br>`POST /api/operations/requisitions/:id/decision` | **Regla crítica:** El rol técnico `admin` no sustituye el rol exigido por `approval_rule` (`403 APPROVER_ROLE_REQUIRED`) y el solicitante no puede autoaprobar su requisición (`403 SELF_APPROVAL`).<br>**Decisión (`200`):** Modal de confirmación para `approved` o `rejected` con `comments`. |
| `/app/orders` | **Órdenes de Compra y Envío** | Lectura: `buyer`, `warehouse`, `finance`, `admin`.<br>Escritura: `buyer`, `admin`. | `GET /api/operations/orders` (`page`, `limit`, `status`)<br>`GET /api/operations/orders/:id`<br>`POST /api/operations/requisitions/:id/orders`<br>`POST /api/operations/orders/:id/send` | **Creación (`201`):** Desde una requisición `approved`, ordena **todas** las líneas en un único proveedor, con `pack_quantity = 1` y unidad base (`409 COMPLETE_ORDER_REQUIRED`, `409 UNIT_CONVERSION_REQUIRED`, `409 APPROVED_BUDGET_EXCEEDED`).<br>**Envío (`200`):** Cambia de `draft` a `sent`. Advierte que registra la acción interna y no envía correos ni pedidos externos al proveedor. |
| `/app/receipts` | **Recepciones de Mercancía** | Lectura: `buyer`, `warehouse`, `finance`, `admin`.<br>Escritura: `warehouse`, `admin`. | `GET /api/operations/receipts` (`page`, `limit`, `status`)<br>`GET /api/operations/receipts/:id`<br>`POST /api/operations/orders/:id/receipts` | **Registro (`201`):** Sobre orden `sent`, `acknowledged` o `partially_received`. Para cada línea: `quantity_received = quantity_accepted + quantity_rejected`. Si `quantity_rejected > 0`, exige `rejection_reason`. Genera entrada de inventario automáticamente para productos `is_stockable`. |
| `/app/inventory` | **Consulta de Saldos y Traslados entre Almacenes** | Saldo: `warehouse`, `buyer`, `analyst`, `admin`.<br>Traslado: `warehouse`, `admin`. | `GET /api/operations/inventory/balance?product_id=&warehouse_id=`<br>`POST /api/operations/inventory/transfers` | **Saldo (`200`):** Muestra `on_hand`, `reserved` y `available`.<br>**Traslado (`201`):** Envía `movement_number` (máx. 35 caracteres), `product_id`, `from_warehouse_id`, `to_warehouse_id`, `quantity`. Maneja `409 INSUFFICIENT_STOCK` y `409 LOT_POLICY_REQUIRED`. |
| `/app/invoices` | **Facturas de Proveedor y Conciliación** | `finance`, `admin` | `GET /api/operations/invoices` (`page`, `limit`, `status`)<br>`GET /api/operations/invoices/:id`<br>`POST /api/operations/orders/:id/invoices`<br>`POST /api/operations/invoices/:id/approve` | **Registro (`201`):** Solo para órdenes en estado `received`. Exige coincidencia exacta de `subtotal`, `tax_total`, `total_amount` y todas las líneas (`quantity_invoiced`, `unit_price`, `tax_rate`) usando cadenas decimales exactas.<br>**Aprobación (`200`):** Pasa la factura de `matched` a `approved`. |
| `/app/payments` | **Programación y Confirmación de Pagos** | `finance`, `admin` | `GET /api/operations/payments` (`page`, `limit`, `status`)<br>`GET /api/operations/payments/:id`<br>`POST /api/operations/invoices/:id/payments`<br>`POST /api/operations/payments/:id/confirm` | **Programar (`201`):** Sobre factura `approved`, crea pago completo (`scheduled`) con `payment_reference` y `payment_method`.<br>**Confirmar (`200`):** Requiere modal de confirmación explícito advirtiendo que **confirmar registra una referencia bancaria (`bank_reference`) y fecha (`payment_date`) de un pago externo ya realizado, y no ejecuta transferencias bancarias**. |

### 3.3 Analítica, Importación y Mantenimiento Administrativo

| Ruta React | Pantalla | Roles permitidos | Endpoints conectados | Estados y Reglas de Negocio |
| :--- | :--- | :--- | :--- | :--- |
| `/app/analytics` | **Análisis de Gasto, Evaluación de Proveedores y Punto de Reorden** | Gasto: `analyst`, `finance`, `admin`<br>Evaluación: `analyst`, `buyer`, `admin`<br>Reorden: `analyst`, `warehouse`, `buyer`, `admin` | `GET /api/operations/analytics/spend?date_from=&date_to=`<br>`GET /api/operations/analytics/evaluations/:id`<br>`GET /api/operations/analytics/reorder` (`product_id`, `warehouse_id`, `page`, `limit`) | Unifica los 3 módulos analíticos en pestañas según el rol del usuario:<br>1. **Gasto:** Agrupado por moneda y categoría (`basis: approved_invoice_lines_including_tax`, `conversion: none`).<br>2. **Evaluación:** Consulta por `evaluation_id`, muestra `weighted_average`, `weight_sum`, `scores` y advertencias de `meta` (`score_scale: not_defined`, `cross_supplier_ranking: false`).<br>3. **Reorden:** Compara `available`, `configured_reorder_point` y `calculated_reorder_point`, mostrando `missing` cuando faltan demanda o plazo. |
| `/app/admin/price-imports` | **Importación Autorizada de Observaciones de Precios** | `admin` | `POST /api/admin/price-imports`<br>`GET /api/price_import_batches` (`page`, `limit`)<br>`GET /api/price_import_batches/:import_batch_id`<br>`GET /api/price_sources`<br>`GET /api/supplier_products` | **Importación (`201`):** Envía `price_source_id`, `price_basis: "per_purchase_unit"` y `rows` (hasta 100 filas).<br>**Resultado por fila:** Incluso con HTTP `201`, el lote puede terminar en `completed_with_errors` o `failed`; se desglosan `records_received`, `records_imported`, `records_rejected` y la tabla detallada de `errors` (`row`, `code`, `message`). Permite inspeccionar lotes previos parseando `error_summary`. |
| `/app/admin/masters` | **Mantenimiento de Datos Maestros y Reglas** | `admin` | CRUD permitido sobre `/api/<recurso>` según `middleware/crud-policy.js` | Evita una pantalla por tabla agrupando los maestros en un centro administrativo con selector de dominio:<br>- **Organización y Finanzas:** `departments`, `cost_centers`, `currencies`, `expense_categories`, `approval_rules` (+ consulta de `roles`).<br>- **Catálogo e Inventario:** `units_of_measure`, `products`, `product_identifiers`, `warehouses`, `product_warehouse_policies`.<br>- **Proveedores y Precios:** `suppliers`, `supplier_contacts`, `supplier_products`, `price_sources`, `evaluation_criteria`.<br>Respeta estrictamente qué recursos admiten `POST`, qué campos exactos admiten `PATCH` y cuáles admiten `DELETE` (con modal de confirmación). |

---

## 4. Funciones Bloqueadas o de Solo Lectura por Reglas de Negocio

De acuerdo con `backend/README.md` y `backend/docs/business-decisions.md`, el frontend **no ofrece formularios de edición ni botones engañosos** para operaciones deshabilitadas (`405 USE_CASE_REQUIRED`) o pendientes de definición empresarial:

1. **Sin cambio libre de `status` vía CRUD:** Los estados de requisiciones, aprobaciones, órdenes, recepciones, facturas y pagos solo cambian mediante sus casos de uso en `/api/operations/*`.
2. **Administración web de usuarios, contraseñas y asignaciones de rol:** `users`, `roles` y `user_roles` tienen escritura genérica bloqueada (`405`), y `auth_credentials` / `auth_sessions` no tienen rutas CRUD. El aprovisionamiento y revocación se realizan por CLI (`npm run access:provision` y `node scripts/revoke-access.js`). La UI explica este procedimiento cuando un administrador consulta referencias o requiere habilitar usuarios.
3. **Inmutabilidad parcial en maestros (`crud-policy.js`):**
   - `product_identifiers`, `approval_rules`, `product_warehouse_policies` y `evaluation_criteria` permiten `POST` (creación), pero **no permiten `PATCH`** (`405`).
   - En `products`, `PATCH` solo permite editar `name`, `description`, `brand`, `model`, `status` (no permite cambiar `sku`, `unit_id`, `category_id` ni `is_stockable`).
   - En `supplier_products` y `price_sources`, `PATCH` solo permite cambiar `status`.
   - Solo `departments`, `cost_centers`, `units_of_measure`, `expense_categories`, `supplier_contacts`, `product_identifiers` y `warehouses` admiten `DELETE` (y MySQL responderá `409 REFERENCE_CONFLICT` si ya están referenciados).
4. **Restricciones del circuito transaccional inicial:**
   - No hay edición ni cancelación de requisiciones u órdenes ya creadas.
   - Una orden de compra debe cubrir todas las líneas de una requisición aprobada con un solo proveedor, en la misma moneda y con presentación de unidad base (`pack_quantity = 1`).
   - Una factura requiere que la orden esté completamente recibida (`received`) y que los montos y líneas coincidan exactamente (sin tolerancias ni facturas parciales).
   - No hay captura manual ni ajuste directo de inventario inicial ni selección de lotes (`409 LOT_POLICY_REQUIRED`), ni captura de evaluaciones de proveedor o corridas de anomalías de gasto hasta que la empresa defina las escalas y umbrales.
