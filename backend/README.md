# Clavos API — MySQL, Express y Sequelize

API para el catálogo público y un recorrido privado de requisición → aprobación → orden → recepción/inventario → factura → pago. Los 45 controladores originales siguen presentes; sus escrituras administrativas están protegidas y las que podrían alterar estados o historial están deshabilitadas. No se usa PostgreSQL ni `sync()`.

**Acción necesaria de seguridad:** la contraseña que estaba versionada en `config/config.json` debe considerarse **comprometida**. El archivo se retiró y la configuración usa variables de entorno, pero esto no elimina la contraseña del historial de Git ni de copias publicadas. El propietario debe rotarla en MySQL, actualizar su `.env` local y revisar dónde más se utilizó. No se imprimió ni se cambió la contraseña de MySQL durante este trabajo. La copia local inicial de `.env` conserva la configuración anterior para permitir la transición; reemplaza esa credencial después de rotarla. No se reescribió el historial ni se hizo commit/push.

## Instalar y arrancar

Requisitos: Node.js 22 o superior (verificado con 24), npm, MySQL 8 y una base de datos ya creada. El usuario MySQL necesita permisos sobre esa base para las migraciones; la cuenta de ejecución puede tener permisos más restringidos después.

```bash
cd backend
npm ci
test -f .env || cp .env.example .env
chmod 600 .env
# Completa .env con tus valores locales; nunca lo publiques.
npm run db:migrate -- --env development
npm run db:status -- --env development
npm run dev
# Inicio sin nodemon:
npm start
```

Servidor predeterminado: `http://localhost:3000`; API: `/api`. Al arrancar se comprueba la conexión a MySQL. El servidor no crea la base, no ejecuta migraciones automáticamente y no sincroniza modelos. `GET /health` comprueba que el proceso HTTP responde; no es un chequeo continuo de MySQL.

`config/config.js` y `.sequelizerc` comparten las variables para Sequelize y sequelize-cli. `node_modules` fue retirado del índice de Git conservando su copia local; se reinstala con npm. No vuelvas a ejecutar el generador histórico `scripts/generate-schema-from-dbml.py` sobre los modelos/migraciones editados.

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | `development`, `test` o `production` |
| `PORT` | Puerto HTTP, predeterminado 3000 |
| `FRONTEND_ORIGIN` | Origen permitido por CORS, predeterminado `http://localhost:5173`; sin barra final |
| `DB_HOST`, `DB_PORT` | Host y puerto MySQL; predeterminados `127.0.0.1`, `3306` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base existente y credenciales locales; sin valores secretos en el repositorio |
| `SESSION_HOURS` | Duración de sesión, predeterminado 8; mayor que 0 y máximo 24 |
| `PRICE_MAX_AGE_HOURS` | Opcional. Política explícita de antigüedad de precios. Vacío = no se afirma vigencia |

Se usa UTC para fechas/hora de la API y conexión MySQL. Las fechas sin hora usan `YYYY-MM-DD`. En despliegue se requiere HTTPS; no se ha configurado ni publicado un despliegue. CORS no sustituye autenticación y no impide llamadas desde curl.

## Migraciones y esquema

- `20261109000000-create-dbml-schema.js`: esquema de negocio original.
- `20261109010000-add-private-access.js`: añade `auth_credentials` y `auth_sessions`, sin modificar usuarios existentes ni asignarles contraseñas.
- `20261109020000-add-supplier-sku-index.js`: incorpora el índice no único `(supplier_id, supplier_sku)` que ya figuraba en el DBML y faltaba en la migración original.

El encabezado del DBML ahora dice MySQL. Se documentó la extensión de acceso en el mismo archivo. Las dos migraciones nuevas son aditivas; su reversión automática está bloqueada para evitar borrar historial. No uses comandos de reinicio/undo para resolver errores: inspecciona el estado y prepara una migración hacia adelante.

```bash
npm run db:status -- --env development
node scripts/verify-schema.js  # Solo lectura: tablas/columnas, PK, FK e índices del DBML
```

## Acceso y login del frontend

No hay registro público, contraseñas predeterminadas ni autenticación simulada. Un operador habilita una cuenta mediante CLI, asociada a `users` y `user_roles`. Los usuarios existentes sin `auth_credentials` no pueden iniciar sesión.

Prepara un archivo JSON **privado fuera del repositorio**, con permisos 600, con este formato (sustituye los marcadores por datos elegidos por ti):

```json
{
  "email": "<correo de la persona>",
  "full_name": "<nombre real>",
  "password": "<contraseña nueva de al menos 12 caracteres>",
  "roles": ["admin"],
  "department_id": 1
}
```

`department_id` es opcional al habilitar acceso; para crear requisiciones debe existir un departamento válido y un centro de costo de ese departamento. Si la persona ya existe se reutiliza por email, sin modificar su identidad/departamento. Si no existe, se crea con los datos suministrados. El CLI agrega roles; no elimina asignaciones existentes.

```bash
npm run access:provision < /ruta/privada/acceso.json
# Restablecer expresamente una contraseña existente y revocar todas sus sesiones:
npm run access:provision -- --reset < /ruta/privada/acceso.json
```

Para revocar acceso desde la operación local: `node scripts/revoke-access.js <user_id>`. Desactiva la cuenta y revoca sus sesiones, conservando el historial. La reactivación/asignación fina de permisos requiere un procedimiento administrativo posterior.

El CLI no imprime contraseñas ni tokens. Las contraseñas se derivan con scrypt y sal aleatoria; solo se almacena el hash. No envíes este archivo ni una contraseña real al chat. La administración web de identidades/roles queda pendiente; no se habilitó el CRUD genérico de usuarios/roles/asignaciones.

Login:

```http
POST /api/auth/login
Content-Type: application/json

{"email":"<correo>","password":"<contraseña>"}
```

```json
{
  "data": {
    "access_token": "<token aleatorio de 64 caracteres hexadecimales>",
    "token_type": "Bearer",
    "expires_at": "2026-11-10T00:00:00.000Z",
    "user": {"user_id": 1, "full_name": "<nombre>", "email": "<correo>", "department_id": 1, "role_ids": [1], "roles": ["requester"]}
  }
}
```

Las respuestas mostradas son ejemplos de contrato, no datos de EPA ni cuentas instaladas. El frontend enviará `Authorization: Bearer <access_token>`. Guarda el token en memoria de la aplicación; no hace falta persistirlo en localStorage. Al recargar o expirar la sesión se vuelve a login. No hay refresh token ni cookie de sesión.

Se eligieron tokens opacos, no JWT: MySQL guarda únicamente SHA-256 del token y permite revocación inmediata. Cada petición comprueba expiración, revocación, estado activo del usuario y roles actuales. No se confía en roles enviados por React. El login limita intentos por IP en memoria y bloquea temporalmente credenciales tras cinco fallos; para varias instancias debe compartirse el limitador antes de producción.

| Endpoint | Acceso | Resultado |
| --- | --- | --- |
| `POST /api/auth/login` | Público, limitado | Crea una sesión después de verificar la contraseña |
| `GET /api/auth/me` | Sesión válida | Identidad y roles actuales, sin hashes |
| `POST /api/auth/logout` | Sesión válida | Revoca la sesión; 204 |

## Matriz de rutas

Roles técnicos del recorrido: `admin`, `requester`, `buyer`, `warehouse`, `finance`, `analyst`. Los nombres se asignan deliberadamente desde CLI; no se crean cuentas ni roles automáticamente al iniciar el servidor. Un rol adicional nombrado en una `approval_rule` habilita la decisión de ese paso. La política debe confirmarse con los responsables de Clavos: [decisiones y pendientes](docs/business-decisions.md).

| Ruta/familia | Lectura | Escritura |
| --- | --- | --- |
| `/health` | Pública | No |
| `/api/catalog/*` | Pública, solo proyección del catálogo activo | No |
| `/api/auth/*` | Según tabla anterior | Login/logout |
| `/api/<tabla>` (CRUD original) | Solo `admin` | Solo catálogo/referencias en lista permitida; historial/identidades bloqueados |
| `/api/admin/price-imports` | Lotes por `/api/price_import_batches`, solo admin | Solo `admin` |
| `/api/operations/requisitions` | Solicitante: propias; buyer/warehouse/admin: internas | Crear: requester/buyer/admin; enviar: propietario |
| `/api/operations/approvals` | Pasos para roles efectivos de la persona | Decidir: rol exacto de la regla, sin autoaprobación |
| `/api/operations/orders`, `/receipts` | buyer/warehouse/finance/admin | Orden: buyer/admin; recepción: warehouse/admin |
| `/api/operations/invoices`, `/payments` | finance/admin | finance/admin |
| `/api/operations/inventory/*` | warehouse/buyer/analyst/admin | Traslados: warehouse/admin |
| `/api/operations/analytics/spend` | analyst/finance/admin | No |
| `/api/operations/analytics/evaluations/:id` | analyst/buyer/admin | No |
| `/api/operations/analytics/reorder` | analyst/warehouse/buyer/admin | No |

`admin` puede realizar los casos de uso permitidos, pero no saltarse estados, montos o el rol exacto de una aprobación. Ninguna escritura administrativa ni dato personal/financiero se expone anónimamente. Las antiguas URLs CRUD mantienen sus nombres, pero ahora requieren acceso; ocultar botones en React no concede permisos.

CRUD administrativo permitido:

- `POST`: departments, cost_centers, currencies, units_of_measure, expense_categories, products, suppliers, supplier_contacts, supplier_products, price_sources, warehouses, product_identifiers, approval_rules, product_warehouse_policies, evaluation_criteria.
- `PATCH`: solo atributos descriptivos/estado autorizados en `middleware/crud-policy.js`. Por ejemplo, no puede cambiar la unidad/categoría de un producto con este endpoint, ni presentación/moneda de un equivalente, ni reglas de aprobación usadas.
- `DELETE`: departments, cost_centers, units_of_measure, expense_categories, supplier_contacts, product_identifiers, warehouses. MySQL impide borrar referencias utilizadas y responde 409.
- Las escrituras genéricas restantes devuelven `405 USE_CASE_REQUIRED` si el controlador tenía ese método; si nunca tuvo ese endpoint, 404. No hay acceso CRUD para `auth_credentials` ni `auth_sessions`.

Los recursos genéricos conservan `GET /api/<tabla> → list`, `POST → create`, `GET /api/<tabla>/:clave → get`, `PATCH → update`, `DELETE → delete`, sujeto a la política anterior. Los parámetros mantienen los nombres reales: por ejemplo `products/:product_id`, `currencies/:currency_code`, `user_roles/:user_id/:role_id`.

## Catálogo y comparación para React

| Endpoint público | Query/resultado |
| --- | --- |
| `GET /api/catalog/products` | `q` busca nombre/SKU/barcode; filtros `category_id`, `unit_id`, `brand`; `page`, `limit` |
| `GET /api/catalog/products/:product_id` | Producto activo, categoría activa y unidad; 404 si no está disponible |
| `GET /api/catalog/products/:product_id/comparison` | Producto y ofertas, `page`, `limit` sobre productos equivalentes |
| `GET /api/catalog/categories` | Categorías activas, `page`, `limit` |

Paginación pública: página inicial 1, límite predeterminado 25, máximo 100; orden estable por ID. Los filtros desconocidos son 400. Un catálogo vacío devuelve `data: []`. La lista de productos usa:

```json
{
  "data": [{
    "product_id": 1, "sku": "<SKU real>", "name": "<producto>",
    "description": null, "brand": null, "model": null, "barcode": null,
    "unit_id": 1, "category_id": 1, "is_stockable": true,
    "category": {"category_id": 1, "code": "<código>", "name": "<categoría>"},
    "unit": {"unit_id": 1, "code": "UN", "name": "Unidad", "allows_decimal": false}
  }],
  "pagination": {"page": 1, "limit": 25, "total": 1}
}
```

Comparación sin ofertas:

```json
{
  "data": {"product": {"product_id": 1, "sku": "<SKU>", "name": "<producto>", "category": {}, "unit": {}}, "offers": []},
  "pagination": {"page": 1, "limit": 25, "total_supplier_products": 0},
  "meta": {"price_basis": "per_purchase_unit", "ranking": "none", "conversion": "none", "presentation_policy": "compare_only_equal_comparison_group", "availability_basis": "purchase_units_at_observed_at"}
}
```

Cada oferta incluye `supplier_product_id`, proveedor (ID/nombres, sin contactos privados), SKU/nombre equivalente, unidad de compra, `pack_quantity`, mínimo de compra, plazo, `price_observation_id`, `unit_price`, `currency_code`, `price_includes_tax`, `observed_at`, `age_seconds`, `freshness`, `available_quantity`, `source_product_url`, fuente, `price_basis` y `comparison_group`. `is_current_price_guaranteed` siempre es `false`. `total_supplier_products` cuenta candidatos activos, no el número de ofertas con observación apta; una página puede contener menos ofertas o ninguna.

No combines precios entre grupos. Las ofertas pueden tener moneda, impuesto o presentación distintos. Los valores de precio/cantidad son cadenas decimales. Las observaciones viejas mantienen su fecha/estado; no hay un precio inventado ni fallback a `last_known_price`. El campo global `meta.price_basis` describe el contrato de las nuevas importaciones; comprueba siempre el `price_basis` de cada oferta histórica. Detalle de procedencia y límites: [EPA e importación](docs/epa.md).

## Importación de precios

```http
POST /api/admin/price-imports
Authorization: Bearer <token admin>
Content-Type: application/json

{
  "price_source_id": 1,
  "price_basis": "per_purchase_unit",
  "rows": [{
    "supplier_product_id": 1,
    "observed_at": "2026-11-09T14:00:00Z",
    "unit_price": "<precio real con hasta 4 decimales>",
    "currency_code": "CRC",
    "price_includes_tax": true,
    "available_quantity": "<cantidad real o null>",
    "source_product_url": "<URL real HTTP(S) o null>",
    "external_reference": "<referencia real o null>",
    "is_validated": true
  }]
}
```

Sustituye los marcadores por observaciones reales autorizadas. No uses estos ejemplos como precios comerciales. Respuesta 201:

```json
{"data":{"import_batch_id":1,"status":"completed_with_errors","records_received":2,"records_imported":1,"records_rejected":1,"errors":[{"row":2,"code":"DUPLICATE_OBSERVATION","message":"Ya existe una observación de esa fuente, producto y fecha."}]}}
```

`GET /api/price_import_batches/:import_batch_id` permite al administrador consultar después el resultado persistido. `error_summary` es un string JSON versionado, no una excepción SQL. Una caída abrupta del proceso puede dejar un lote `running`; requiere revisión operativa. No se relanza automáticamente ni se afirma actualización automática de EPA.

## Recorrido privado con curl

Se necesitan datos maestros reales: departamento/centro de costo, moneda, unidad, categoría, producto, proveedor/equivalente y almacén, además de una regla de aprobación aplicable. El equivalente debe representar una unidad base para el circuito inicial. El administrador los registra por los CRUD permitidos. Las cuentas se habilitan por CLI con sus roles y departamentos; el aprobador debe ser una persona distinta del solicitante.

Los ejemplos usan IDs y montos **ilustrativos**: reemplázalos por tus datos. No se cargan como semillas. Usa archivos de solicitud fuera del repositorio si contienen datos personales. Un archivo privado `login.json` contiene email y password; para cada persona:

```bash
curl -sS http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' --data-binary @/ruta/privada/login.json
```

Guarda los tokens en variables de tu terminal (`REQUESTER_TOKEN`, `APPROVER_TOKEN`, `BUYER_TOKEN`, `WAREHOUSE_TOKEN`, `FINANCE_TOKEN`, `ADMIN_TOKEN`). Los siguientes comandos no imprimen credenciales de MySQL. `BASE=http://localhost:3000/api`.

```bash
BASE=http://localhost:3000/api
# Comprobaciones públicas:
curl -sS "$BASE/catalog/products?q=clavo&page=1&limit=20"
curl -sS "$BASE/catalog/products/1/comparison"
# Anónimo: debe ser 401.
curl -i "$BASE/payments"

# 1. Requisición: respuesta data.requisition_id -> REQ_ID.
curl -sS -X POST "$BASE/operations/requisitions" \
  -H "Authorization: Bearer $REQUESTER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"requisition_number":"REQ-REAL-001","cost_center_id":1,"currency_code":"CRC","business_justification":"Compra autorizada","lines":[{"product_id":1,"quantity_requested":"2.000","estimated_unit_price":"120.0000"}]}'

# 2. Envío y decisión, repetir decisión por cada paso pendiente con el rol correcto.
curl -sS -X POST "$BASE/operations/requisitions/$REQ_ID/submit" -H "Authorization: Bearer $REQUESTER_TOKEN"
curl -sS "$BASE/operations/approvals" -H "Authorization: Bearer $APPROVER_TOKEN"
curl -sS -X POST "$BASE/operations/requisitions/$REQ_ID/decision" \
  -H "Authorization: Bearer $APPROVER_TOKEN" -H 'Content-Type: application/json' -d '{"decision":"approved","comments":"Revisado"}'
# Consultar las líneas para obtener REQ_LINE_ID.
curl -sS "$BASE/operations/requisitions/$REQ_ID" -H "Authorization: Bearer $BUYER_TOKEN"

# 3. Orden: completar order.json con todos los IDs/precios reales; respuesta -> ORDER_ID.
# Forma: {"po_number":"...","supplier_id":1,"lines":[{"requisition_line_id":1,"supplier_product_id":1,"unit_price":"100.0000","tax_rate":"0.1300"}]}
curl -sS -X POST "$BASE/operations/requisitions/$REQ_ID/orders" \
  -H "Authorization: Bearer $BUYER_TOKEN" -H 'Content-Type: application/json' --data-binary @order.json
curl -sS -X POST "$BASE/operations/orders/$ORDER_ID/send" -H "Authorization: Bearer $BUYER_TOKEN"
curl -sS "$BASE/operations/orders/$ORDER_ID" -H "Authorization: Bearer $WAREHOUSE_TOKEN"

# 4. Recepción: receipt.json usa los purchase_order_line_id reales.
# {"receipt_number":"...","warehouse_id":1,"lines":[{"purchase_order_line_id":1,"quantity_received":"2.000","quantity_accepted":"2.000","quantity_rejected":"0.000"}]}
curl -sS -X POST "$BASE/operations/orders/$ORDER_ID/receipts" \
  -H "Authorization: Bearer $WAREHOUSE_TOKEN" -H 'Content-Type: application/json' --data-binary @receipt.json
curl -sS "$BASE/operations/inventory/balance?product_id=1&warehouse_id=1" -H "Authorization: Bearer $WAREHOUSE_TOKEN"

# 5. Factura real completa: invoice.json. Respuesta -> INVOICE_ID.
# {"invoice_number":"...","invoice_date":"2026-11-09","subtotal":"200.00","tax_total":"26.00","total_amount":"226.00","lines":[{"purchase_order_line_id":1,"quantity_invoiced":"2.000","unit_price":"100.0000","tax_rate":"0.1300"}]}
curl -sS -X POST "$BASE/operations/orders/$ORDER_ID/invoices" \
  -H "Authorization: Bearer $FINANCE_TOKEN" -H 'Content-Type: application/json' --data-binary @invoice.json
curl -sS -X POST "$BASE/operations/invoices/$INVOICE_ID/approve" -H "Authorization: Bearer $FINANCE_TOKEN"

# 6. Programar pago completo: respuesta -> PAYMENT_ID.
curl -sS -X POST "$BASE/operations/invoices/$INVOICE_ID/payments" \
  -H "Authorization: Bearer $FINANCE_TOKEN" -H 'Content-Type: application/json' \
  -d '{"payment_reference":"<referencia única real>","payment_method":"transfer"}'
# Confirmar solamente tras comprobar el pago real. No ejecuta una transferencia bancaria.
curl -sS -X POST "$BASE/operations/payments/$PAYMENT_ID/confirm" \
  -H "Authorization: Bearer $FINANCE_TOKEN" -H 'Content-Type: application/json' \
  -d '{"payment_date":"2026-11-09","bank_reference":"<referencia real>"}'
```

Todos los comandos de creación responden 201; envío, decisión, aprobación y confirmación responden 200 con `{ "data": <documento> }`. Los documentos mantienen los nombres de columnas del DBML. Los detalles `GET /operations/requisitions|orders|receipts|invoices|payments/:id` añaden `lines`; requisiciones también incluyen `approvals`. Las colecciones de esas cinco familias aceptan `page`, `limit`, `status` y devuelven `pagination.total`. No hay un endpoint para cambiar `status` libremente.

Otros casos de uso:

| Endpoint | Entrada |
| --- | --- |
| `POST /operations/inventory/transfers` | `movement_number` (máx. 35), `product_id`, `from_warehouse_id`, `to_warehouse_id`, `quantity` |
| `GET /operations/analytics/spend` | `date_from`, `date_to`; grupos por moneda/categoría |
| `GET /operations/analytics/evaluations/:id` | Evaluación existente; promedio/criterios y advertencia de escala |
| `GET /operations/analytics/reorder` | `product_id`, `warehouse_id` opcionales, `page`, `limit` |

## Contrato para frontend/src/services/

Configura `VITE_API_URL=http://localhost:3000/api` en el futuro frontend. Nunca pongas contraseñas MySQL, credenciales de proveedores ni claves privadas en variables `VITE_*`. Adaptador orientativo, sin modificar todavía el frontend:

```js
const API = import.meta.env.VITE_API_URL;
export async function api(path, { token, body, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error.message);
    error.status = response.status;
    error.code = payload.error.code;
    error.details = payload.error.details;
    throw error;
  }
  return payload;
}
// const { data, pagination } = await api('/catalog/products?page=1');
// const { data } = await api('/auth/login', { method: 'POST', body: { email, password } });
```

- Éxito: `{data}` y, en colecciones, `{pagination}`; comparación añade `meta`.
- Error: `{error:{code,message,details?}}`; no stack, SQL, contraseña ni hash. `details` usa nombres de campos/reglas o información validada.
- IDs: números; `currency_code`: string de 3 caracteres. Decimales: strings (`"226.00"`, `"2.000"`); evita reconvertirlos a Number para calcular facturas en el cliente. El backend es la autoridad de cálculos/permisos.
- Fechas/hora: ISO UTC; fechas civiles: `YYYY-MM-DD`; campos opcionales: `null` cuando no hay dato.
- 401: descartar token y volver a login. 403: mostrar falta de permiso. 409: releer documento/mostrar discrepancia, no forzar el estado. 405: flujo no habilitado. Un lote 201 puede contener errores por fila.

| HTTP | Significado |
| --- | --- |
| 200 / 201 / 204 | Consulta/acción, creación, eliminación permitida/logout |
| 400 | JSON, campos, parámetros, valores o filtros inválidos |
| 401 / 403 | Sesión inválida/ausente o permiso/origen insuficiente |
| 404 | Ruta o recurso no disponible |
| 405 | Escritura genérica bloqueada; usar servicio |
| 409 | Unicidad, FK, estado, presupuesto, cantidades o concurrencia |
| 413 / 429 | Cuerpo demasiado grande / límite de login |
| 500 / 503 | Error interno sin detalles / base de datos no disponible |

## Pruebas y verificaciones

```bash
npm test                 # Pruebas sin MySQL
npm run test:mysql       # HTTP real + MySQL; datos sintéticos, transacción externa y rollback
node scripts/verify-schema.js
npm run db:status -- --env development
```

Las pruebas MySQL usan la base configurada en `.env`, no la reinician ni crean otra. Requieren las migraciones aplicadas y permiso de conexión/escritura transaccional. Crean fixtures dentro de una transacción externa, usan savepoints para los casos de uso y siempre hacen rollback; no ejecutan DROP/TRUNCATE/DELETE de limpieza. Verifican que los usuarios de prueba no persistan. Pueden avanzar contadores autoincrementales aunque reviertan los datos. Ejecutarlas en un entorno local aislado evita bloqueos de trabajo real; no son una prueba de carga ni de deadlocks concurrentes.

Verificación realizada el 9 de noviembre de 2026:

- Pruebas unitarias: 10 casos aprobados (validación, redondeo, grupos de comparación, políticas, permisos y scrypt).
- Integración MySQL/HTTP: 10 escenarios aprobados dentro de un test principal (11 reportados por node:test), con autenticación/expiración/logout, CORS/JSON/404, protección de CRUD, catálogo, importación/duplicados, aprobaciones, orden/budget, recepción/stock, factura/pago, traslado/reservas y cálculos de gasto/evaluación/reorden.
- Esquema: 47 tablas documentadas (45 de negocio + 2 de acceso), 118 FK e índices declarados comprobados; sin diferencias en nombres de columnas, PK/FK e índices. `SequelizeMeta` es adicional. Esta revisión no certifica tipos SQL, defaults ni semántica de registros heredados.
- Arranque real de `index.js`: conexión MySQL, `/health` HTTP 200 y cierre controlado comprobados; el proceso de prueba se detuvo al terminar.
- Tres migraciones en estado `up`. La primera conexión desde el entorno restringido falló con EPERM; se repitió con autorización y MySQL estuvo disponible. No quedaron pruebas bloqueadas por credenciales o MySQL en esta ejecución.

## Pantallas que pueden conectarse y dependencias

Disponibles: catálogo/búsqueda/filtros; detalle y comparación de ofertas; login/sesión; consulta administrativa de maestros y mantenimiento permitido; importación y resultados por fila; creación/lista/detalle de requisiciones; bandeja de aprobaciones; orden/envío; recepción; saldo/traslado; factura conciliada/aprobación; programación/confirmación de pago; gasto por moneda/categoría; consulta de cálculos de evaluación/reorden si hay datos reales.

Para probar con datos de negocio hacen falta cuentas habilitadas, roles/reglas de aprobación y datos maestros reales. El catálogo puede estar vacío y funcionar correctamente. La importación requiere observaciones reales autorizadas; EPA automático sigue pendiente de autorización/documentación. Evaluaciones y demanda no se fabrican para llenar dashboards. Edición/cancelación de documentos, variantes de compra/factura/pago, lotes/valuación, administración web de acceso y detección automática de anomalías están detalladas en [business-decisions.md](docs/business-decisions.md).
