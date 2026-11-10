# Ferretería Clavos — Frontend React + Vite

Interfaz web en React 18 y Vite para **Ferretería Clavos**, diseñada bajo una arquitectura de cuadrícula técnica suiza (*Swiss Grid*) y conectada al contrato real del backend Express/Sequelize/MySQL (`backend/`).

Cubre el recorrido público (inicio, catálogo filtrable, ficha técnica y comparación de observaciones históricas de precios por proveedor) y el circuito operativo privado (inicio de sesión con token opaco Bearer en memoria, requisiciones, aprobaciones por paso, órdenes de compra, recepciones e inventario, facturas conciliadas, programación/confirmación de pagos, analítica de gasto/evaluación/reorden, importación autorizada de precios con errores por fila y mantenimiento de maestros permitidos).

---

## 1. Requisitos y Comandos

Requisitos: Node.js 22+ (verificado con Node 24) y npm.

```bash
cd frontend
npm install

# Configurar variables de entorno (opcional si el backend corre en http://localhost:3000/api)
cp .env.example .env

# Servidor de desarrollo en http://localhost:5173 (coincide con FRONTEND_ORIGIN del backend)
npm run dev

# Compilación de producción
npm run build

# Previsualización del paquete compilado
npm run preview

# Ejecutar pruebas automatizadas de contrato, adaptador HTTP y aritmética BigInt
npm test
```

---

## 2. Variables de Entorno

Definidas en `frontend/.env.example`:

| Variable | Valor predeterminado | Uso |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:3000/api` | URL base de la API del backend Clavos (sin barra final). |

> **Seguridad:** Nunca coloques contraseñas de MySQL, hashes, tokens ni secretos privados en variables `VITE_*`.

---

## 3. Estructura del Proyecto

Jerarquía: `Componentes → Páginas → Rutas → App.jsx → main.jsx`.

- `marckdownsFrontend/Bpracticas.md`: Guía de buenas prácticas original conservada intacta.
- `PLAN_UX.md`: Mapa completo de pantallas, rutas, permisos, estados y funciones bloqueadas por negocio.
- `RESUMEN_IMPLEMENTACION.md`: Auditoría de entrega, endpoints conectados, pruebas ejecutadas y verificación pendiente con MySQL local.
- `.stitch/DESIGN.md`: Sistema de diseño local (ancla **Swiss** de `frontend-design` + reglas de `taste-design`).
- `src/services/`: Adaptador central `fetch` (`apiClient.js`), aritmética decimal exacta `BigInt` (`decimal.js`), `catalogService.js`, `authService.js`, `operationsService.js`, `adminService.js` y pruebas en `src/services/__tests__/contracts.test.js`.
- `src/features/`: Estado de sesión en memoria (`AuthContext.jsx`) y formateadores (`formatters.js`).
- `src/components/`: `AppShell.jsx`, `ProductCard.jsx`, `OfferGroupCard.jsx`, `StatusBadge.jsx`, `ErrorAlert.jsx`, `SkeletonLoader.jsx`, `EmptyState.jsx`, `ConfirmModal.jsx`, `PaginationBar.jsx`.
- `src/pages/`: Vistas públicas y privadas desacopladas con carga diferida (`React.lazy`).
- `src/routes/AppRoutes.jsx`: Definición de rutas públicas y guardia de sesión privada (`RequireSession`).
- `src/mocks/syntheticContractFixtures.js`: Datos sintéticos etiquetados como `SYNTHETIC TEST`, usados exclusivamente por `npm test` y nunca importados por la interfaz operativa.

---

## 4. Rutas de la Aplicación

### Recorrido Público
- `/`: Resumen del sistema, reglas de transparencia de precios, categorías activas y vista rápida del catálogo.
- `/catalog`: Catálogo público con búsqueda (`q`) y filtros (`category_id`, `unit_id`, `brand`, `page`, `limit`).
- `/catalog/products/:productId`: Ficha técnica del producto activo.
- `/catalog/products/:productId/comparison`: Comparación de observaciones de precios separada estrictamente por `comparison_group` (`unidad | pack_quantity | moneda | impuesto`) y bandeja separada para observaciones legacy sin base confirmada (`unconfirmed_legacy_basis`). Muestra siempre `is_current_price_guaranteed: false`.

### Acceso y Recorrido Privado
- `/login`: Inicio de sesión con token opaco Bearer guardado solo en memoria.
- `/app`: Panel operativo por rol, verificación `GET /api/auth/me` y cierre de sesión `POST /api/auth/logout` (`204`).
- `/app/requisitions`: Lista, detalle (con líneas y aprobaciones), creación en borrador y envío (`submit`) por el propietario.
- `/app/approvals`: Bandeja de pasos pendientes para los `role_ids` del actor actual y decisión (`approved` / `rejected`).
- `/app/orders`: Emisión de orden completa desde requisición aprobada, listado, detalle y marcado de envío (`send`).
- `/app/receipts`: Registro de recepción en almacén (`quantity_received = accepted + rejected`), listado y detalle.
- `/app/inventory`: Consulta de saldo (`on_hand`, `reserved`, `available`) y traslados transaccionales entre almacenes.
- `/app/invoices`: Registro de factura conciliada con validación `BigInt`, listado, detalle y aprobación financiera.
- `/app/payments`: Programación de pago (`scheduled`) y confirmación de referencia bancaria externa (`completed`).
- `/app/analytics`: Análisis de gasto por moneda/categoría, promedio ponderado de evaluación de proveedor y punto de reorden.
- `/app/admin/price-imports`: Importación de lotes de precios (`per_purchase_unit`), desglose de errores por fila e inspección de `price_import_batches`.
- `/app/admin/masters`: Mantenimiento de datos maestros y reglas conforme a `backend/middleware/crud-policy.js`.

---

## 5. Cómo Comprobar con tu Backend y MySQL Local

1. **Arrancar el backend local con MySQL 8 activo:**
   ```bash
   cd backend
   npm run db:migrate -- --env development
   npm run dev
   ```
   Asegúrate de que `FRONTEND_ORIGIN=http://localhost:5173` esté activo en el entorno del backend.

2. **Habilitar cuentas reales por CLI (fuera del repositorio):**
   Crea un JSON privado con permisos `600` y aprovisiona los usuarios necesarios (`admin`, `requester`, `buyer`, `warehouse`, `finance`, `analyst` y el rol aprobador de tus reglas):
   ```bash
   cd backend
   npm run access:provision < /ruta/privada/acceso.json
   ```

3. **Arrancar el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Abre `http://localhost:5173` en el navegador y recorre el flujo público y privado.
