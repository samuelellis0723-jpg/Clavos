# Resumen de Implementación y Auditoría (`RESUMEN_IMPLEMENTACION.md`)

## 1. Estado General y Decisiones de Diseño

Se completaron secuencialmente las **Fases 1 a 6** de `FRONTEND_ROADMAP.md` en la rama `samuel`, escribiendo únicamente dentro de `frontend/` y preservando intacto `frontend/marckdownsFrontend/Bpracticas.md`.

### Uso de Skills y Limitación de Stitch MCP en este Entorno
- **`frontend-design` (`.agents/skills/frontend-design/SKILL.md`):** Se adoptó el ancla **Swiss** con superficie blanca pura (`#FFFFFF`) y gris neutro frío (`#F7F7F8`), tipografía sans-serif con numerales tabulares (`tabular-nums`) para códigos/montos/fechas, estructura de cuadrícula visible de `1px` (*hairline rules*), alineación izquierda y acento único **Yves Klein Blue** (`#002FA7`). El movimiento diferenciador es el sistema de **folios numerados y celdas técnicas a sangre** que enmarcan cada grupo de comparación y cada documento del circuito transaccional.
- **`taste-design` (`.agents/skills/taste-design/SKILL.md`):** Se generó `frontend/.stitch/DESIGN.md` codificando la paleta, reglas tipográficas, componentes, colapso móvil (`< 768px`), objetivos táctiles de `44px`, respeto por `@media (prefers-reduced-motion: reduce)` y prohibición de datos ficticios.
- **`stitch` y `manage-design-system`:** Este entorno de ejecución remoto **no dispone de herramientas Stitch MCP autenticadas** (`StitchMCP`). Siguiendo las instrucciones explícitas del roadmap, se dejó constancia de esta limitación y se construyeron localmente el sistema de diseño (`frontend/.stitch/DESIGN.md`) y todos los componentes React.

---

## 2. Pantallas y Endpoints Conectados

| Pantalla / Ruta | Archivo de Página | Endpoints Reales Conectados |
| :--- | :--- | :--- |
| Inicio (`/`) | `src/pages/HomePage.jsx` | `GET /api/catalog/categories`<br>`GET /api/catalog/products` |
| Catálogo Público (`/catalog`) | `src/pages/CatalogPage.jsx` | `GET /api/catalog/products` (`q`, `category_id`, `unit_id`, `brand`, `page`, `limit`)<br>`GET /api/catalog/categories` |
| Detalle de Producto (`/catalog/products/:productId`) | `src/pages/ProductDetailPage.jsx` | `GET /api/catalog/products/:product_id` |
| Comparación de Ofertas (`/catalog/products/:productId/comparison`) | `src/pages/ProductComparisonPage.jsx` | `GET /api/catalog/products/:product_id/comparison` (`page`, `limit`) |
| Inicio de Sesión (`/login`) | `src/pages/LoginPage.jsx` | `POST /api/auth/login` |
| Panel Operativo (`/app`) | `src/pages/DashboardPage.jsx` | `GET /api/auth/me`<br>`POST /api/auth/logout` (`204 No Content`) |
| Requisiciones (`/app/requisitions`) | `src/pages/RequisitionsPage.jsx` | `GET /api/operations/requisitions`<br>`GET /api/operations/requisitions/:id`<br>`POST /api/operations/requisitions`<br>`POST /api/operations/requisitions/:id/submit` |
| Bandeja de Aprobaciones (`/app/approvals`) | `src/pages/ApprovalsPage.jsx` | `GET /api/operations/approvals`<br>`GET /api/operations/requisitions/:id`<br>`POST /api/operations/requisitions/:id/decision` |
| Órdenes de Compra (`/app/orders`) | `src/pages/OrdersPage.jsx` | `GET /api/operations/orders`<br>`GET /api/operations/orders/:id`<br>`POST /api/operations/requisitions/:id/orders`<br>`POST /api/operations/orders/:id/send` |
| Recepciones (`/app/receipts`) | `src/pages/ReceiptsPage.jsx` | `GET /api/operations/receipts`<br>`GET /api/operations/receipts/:id`<br>`POST /api/operations/orders/:id/receipts` |
| Inventario y Traslados (`/app/inventory`) | `src/pages/InventoryPage.jsx` | `GET /api/operations/inventory/balance`<br>`POST /api/operations/inventory/transfers` |
| Facturas (`/app/invoices`) | `src/pages/InvoicesPage.jsx` | `GET /api/operations/invoices`<br>`GET /api/operations/invoices/:id`<br>`POST /api/operations/orders/:id/invoices`<br>`POST /api/operations/invoices/:id/approve` |
| Pagos (`/app/payments`) | `src/pages/PaymentsPage.jsx` | `GET /api/operations/payments`<br>`GET /api/operations/payments/:id`<br>`POST /api/operations/invoices/:id/payments`<br>`POST /api/operations/payments/:id/confirm` |
| Analítica (`/app/analytics`) | `src/pages/AnalyticsPage.jsx` | `GET /api/operations/analytics/spend`<br>`GET /api/operations/analytics/evaluations/:id`<br>`GET /api/operations/analytics/reorder` |
| Importación de Precios (`/app/admin/price-imports`) | `src/pages/PriceImportsPage.jsx` | `POST /api/admin/price-imports`<br>`GET /api/price_import_batches`<br>`GET /api/price_import_batches/:import_batch_id` |
| Maestros y Reglas (`/app/admin/masters`) | `src/pages/AdminMastersPage.jsx` | `GET`, `POST`, `PATCH`, `DELETE` sobre `/api/<tabla>` respetando `middleware/crud-policy.js` |

---

## 3. Cumplimiento de Reglas Críticas del Contrato

1. **Adaptador `fetch` central (`src/services/apiClient.js`):**
   - Comprueba `response.ok` y `response.status`.
   - En respuestas `204` (`logout` y `DELETE`), retorna `null` sin invocar `response.json()`.
   - Distingue fallos de red (`isNetworkError: true`, `code: 'NETWORK_ERROR'`) de errores HTTP del servidor.
   - Propaga `status`, `error.code`, `error.message` y `error.details` para `400`, `401`, `403`, `404`, `405`, `409`, `413`, `429`, `500` y `503`.
   - En `401` sobre rutas autenticadas, limpia automáticamente el token en memoria y redirige a `/login` con aviso explicativo.
2. **Aritmética decimal exacta (`src/services/decimal.js`):**
   - Replica la lógica `BigInt` escalada de `backend/lib/decimal.js` (cantidades a 3 decimales, precios unitarios y tasas de impuesto a 4 decimales, totales redondeados mitad hacia arriba a 2 decimales).
   - Nunca convierte decimales monetarios a `Number` para calcular o validar facturas, órdenes o requisiciones.
3. **Comparación pública sin mezclar grupos (`src/services/catalogService.js` y `src/components/OfferGroupCard.jsx`):**
   - Agrupa las ofertas estrictamente por `comparison_group` (`purchase_unit_id|pack_quantity|currency_code|tax`).
   - Separa las observaciones con `price_basis: "unconfirmed_legacy_basis"` o `comparison_group: null` en una sección no comparable.
   - Muestra `is_current_price_guaranteed: false`, `freshness`, `age_seconds`, `observed_at` y `source` en cada fila, sin declarar ganadores entre presentaciones incompatibles ni inventar precios de EPA.
4. **Confirmación de pagos externos (`src/pages/PaymentsPage.jsx`):**
   - Incluye advertencia permanente en pantalla y modal de confirmación obligatorio explicando que confirmar un pago registra únicamente la fecha y referencia bancaria (`bank_reference`) de un desembolso externo ya realizado y **no transfiere dinero**.

---

## 4. Pruebas Ejecutadas en este Entorno

1. **Compilación de producción (`npm run build`):**
   - Ejecutada con éxito (`vite build`, 70 módulos transformados, chunks generados sin errores ni advertencias).
2. **Pruebas unitarias y de contrato (`npm test`):**
   - 9 pruebas automatizadas aprobadas en `src/services/__tests__/contracts.test.js` con `node --test`:
     - Construcción y limpieza de query strings (`buildQueryString`).
     - Manejo de `204 No Content` sin `response.json()`.
     - Distinción entre fallo de red (`ECONNREFUSED`) y errores HTTP.
     - Propagación de errores `400`, `401`, `403`, `404`, `405`, `409`, `429`, `503` y limpieza de sesión en `401`.
     - Flujo de login (`POST /api/auth/login`) y manejo de `401 INVALID_CREDENTIALS`.
     - Separación estricta de `comparison_group` y ofertas legacy (`unconfirmed_legacy_basis`).
     - Cálculos exactos `BigInt` de subtotales, impuestos y totales de factura/orden con redondeo mitad hacia arriba.
     - Filtrado estricto de campos editables en `PATCH` conforme a `middleware/crud-policy.js`.
     - Parseo del sobre JSON versionado `error_summary` en lotes de importación de precios.

---

## 5. Verificaciones Pendientes con tu MySQL Local y Funciones Bloqueadas por Negocio

### 5.1 Qué debe comprobarse localmente con MySQL 8
Dado que este entorno remoto no accede a la instancia MySQL de la computadora del propietario, la integración HTTP en vivo debe comprobarse localmente ejecutando `backend` (`http://localhost:3000`) y `frontend` (`http://localhost:5173`):
1. **Login y sesión:** Iniciar sesión con usuarios aprovisionados vía `npm run access:provision`, comprobar `GET /api/auth/me`, cerrar sesión (`204`) y verificar que recargar la página solicita login nuevamente.
2. **Catálogo y comparación:** Verificar productos activos, filtros `q`/`category_id`/`unit_id`/`brand` y agrupación de ofertas reales en `/catalog/products/:id/comparison`.
3. **Circuito completo con cuentas separadas:**
   - Crear y enviar requisición con cuenta `requester` (con departamento y centro de costo activos).
   - Aprobar cada paso en `/app/approvals` con una cuenta distinta que posea el rol exacto de `approval_rules`.
   - Crear orden completa en `/app/orders` y marcarla `sent` con cuenta `buyer`.
   - Registrar recepción en `/app/receipts` y verificar saldo/traslado en `/app/inventory` con cuenta `warehouse`.
   - Registrar factura conciliada en `/app/invoices`, aprobarla, programar pago en `/app/payments` y confirmar referencia bancaria con cuenta `finance`.
   - Consultar gasto, evaluación y reorden en `/app/analytics` y probar un lote de importación en `/app/admin/price-imports` con cuenta `admin`.

### 5.2 Pantallas / Acciones Bloqueadas por Reglas de Negocio del Backend
- **Edición web de usuarios, contraseñas y asignaciones de rol:** Bloqueada en el backend (`405 USE_CASE_REQUIRED` en `/api/users`, `/api/roles`, `/api/user_roles`; sin rutas para `auth_credentials`). Se gestiona mediante los scripts CLI `npm run access:provision` y `node scripts/revoke-access.js`.
- **Edición o cancelación de requisiciones, órdenes, recepciones, facturas o pagos:** El backend bloquea `PATCH`/`DELETE` genéricos sobre documentos transaccionales (`405 USE_CASE_REQUIRED`).
- **Órdenes divididas entre varios proveedores o con `pack_quantity != 1`:** Bloqueadas en el circuito inicial (`409 COMPLETE_ORDER_REQUIRED` / `409 UNIT_CONVERSION_REQUIRED`).
- **Traslados de productos con control por lotes:** Bloqueados hasta definir la política de selección de lotes (`409 LOT_POLICY_REQUIRED`).
- **Captura web de nuevas evaluaciones de proveedor y corridas de anomalías de gasto:** Bloqueadas hasta definir escalas normalizadas y umbrales empresariales (`backend/docs/business-decisions.md`).
