# Clavos — roadmap autónomo de frontend

## Contexto real del repositorio

- Rama de trabajo: `samuel`. La rama `main` no contiene todavía el backend actualizado.
- Backend existente: `backend/` (Express + Sequelize + MySQL). Su contrato y ejemplos están en `backend/README.md`; las reglas empresariales pendientes están en `backend/docs/business-decisions.md` y el alcance de EPA en `backend/docs/epa.md`.
- Frontend por crear: `frontend/`. El archivo `frontend/marckdownsFrontend/Bpracticas.md` ya existe; consérvalo.
- Producto: Ferretería Clavos; catálogo público de productos y comparación de observaciones de precios por proveedor; circuito privado requisición → aprobación → orden → recepción/inventario → factura → pago; análisis de gasto y reorden.
- API local de desarrollo: `http://localhost:3000/api`; parametrizar con `VITE_API_URL`. El servidor solo permite el origen configurado en `FRONTEND_ORIGIN` (predeterminado `http://localhost:5173`).
- Acceso existente: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` con token opaco Bearer, no JWT. Token en memoria; tras recarga o expiración, nuevo login. No hay registro público ni cuentas de demostración.
- Datos comerciales: no hay actualización automática autorizada de EPA. Precios históricos reales validados solo si fueron importados; nunca prometer vigencia de una observación.

## Límites de la ejecución remota

1. Confirmar `samuel` y revisar `git status` antes de trabajar. Si la copia remota está en otra rama o tiene cambios ajenos sin resolver, informar y evitar sobrescrituras.
2. El agente solo crea/modifica/borra archivos bajo `frontend/`. Puede leer `backend/README.md`, `backend/routes/`, `backend/controllers/`, `backend/services/`, `backend/models/` y documentación del backend para contrastar rutas y respuestas. No abrir `backend/.env`, secretos o archivos privados.
3. El archivo raíz `FRONTEND_ROADMAP.md` y `.agents/skills/` son instrucciones y fuentes de lectura, no zona de escritura del agente. No tocar el backend ni modificar su API para ajustar una pantalla.
4. No hacer commits, pushes o despliegues automáticamente. No generar datos ficticios que parezcan precios, inventario, proveedores, pagos o cuentas reales.
5. Un entorno remoto normalmente no accede al MySQL de la computadora del propietario. Compilar y probar con respuestas de contrato no demuestra integración real; registrar por separado qué se pudo probar y qué deberá verificarse localmente.
6. Las skills incluidas se descubren desde `.agents/skills/<nombre>/SKILL.md`. `frontend-design` guía el lenguaje visual. `taste-design` puede generar `frontend/.stitch/DESIGN.md`. `stitch` y `manage-design-system` requieren herramientas Stitch MCP autenticadas para usar el servicio. Si no aparecen, continuar con diseño y React locales; no afirmar haber usado Stitch. Nunca pegar credenciales ni copiar ejemplos de datos falsos al producto.
7. Si las instrucciones visuales de una skill contradicen el contrato real, accesibilidad, legibilidad de cifras o preferencias de movimiento reducido, prevalecen esos requisitos funcionales.

## Fase 1 — Descubrimiento y mapa de pantallas (guía: paso 8)

- Leer contrato de `backend/README.md`, confirmar con rutas y controladores las formas de `{data}`, `{pagination}`, `{meta}`, errores `{error:{code,message,details?}}` y roles.
- Escribir `frontend/PLAN_UX.md`: público (inicio, catálogo, detalle, comparación) y privado (login, panel por rol, mantenimiento permitido, importación, requisiciones, aprobaciones, órdenes, recepciones, inventario, facturas, pagos, gasto, evaluación, reorden). Mapear cada pantalla a endpoints reales y estados de carga, vacío y error.
- Documentar funciones aún bloqueadas por reglas de negocio o ausencia de datos; no crear pantallas editables para recursos solo de lectura. Evitar una pantalla por tabla.

## Fase 2 — Estructura React/Vite (paso 9)

- Inicializar `frontend/` preservando sus archivos existentes. Jerarquía `Componentes → Páginas → Rutas → App.jsx → main.jsx`. Estructura `src/assets`, `components`, `features`, `pages`, `routes`, `services`; `mocks` únicamente para pruebas y con datos claramente sintéticos.
- Configurar `VITE_API_URL` con `frontend/.env.example` sin secretos. No copiar credenciales a `VITE_*`.
- Mantener páginas y navegación adaptables, accesibles con teclado y a móvil. Verificar `npm run build`.

## Fase 3 — Sistema visual y componentes (paso 10)

- Usar `frontend-design` como base. Preferencia inicial: una dirección Swiss de fondo claro, cuadrícula, tipografía sans y un acento azul; si existe marca real, ajustarse a ella y documentar la decisión. No usar cifras de negocio inventadas.
- Revisar `taste-design` para coherencia visual y `prefers-reduced-motion`. Con Stitch MCP autenticado y disponible, usar `manage-design-system` y `stitch` para bocetos de las pantallas principales; guardar referencias locales bajo `frontend/.stitch/`. Si no hay MCP, desarrollar los componentes directamente.
- Construir navegación, tarjetas de producto/oferta, tablas, formularios, mensajes de estado, modal de confirmación cuando la operación sea irreversible. Verificar contraste, foco visible, uso táctil y `npm run build`.

## Fase 4 — Recorrido público y servicios (pasos 11 y 12)

- Conectar exclusivamente `GET /api/catalog/products`, `GET /api/catalog/categories`, `GET /api/catalog/products/:product_id`, `GET /api/catalog/products/:product_id/comparison`; conservar paginación/filtros reales.
- Mostrar proveedor, unidad de compra, `pack_quantity`, moneda, tratamiento de impuesto, fuente, fecha y `freshness`. No mezclar grupos `comparison_group`, no declarar ganador entre presentaciones/monedas/impuestos incompatibles. Mostrar `offers: []`, precios históricos y `is_current_price_guaranteed: false` fielmente.
- Adaptador `fetch` central: examinar `response.ok` y `response.status`; 204 sin `json()`; distinguir red de HTTP; propagar `error.code`, `message` y `details`; tratar 401/403/404/405/409/429/5xx según el contrato. No convertir decimales monetarios a Number para cálculos de facturas.
- Verificar rutas, pantalla vacía y errores y ejecutar `npm run build`.

## Fase 5 — Acceso y operaciones privadas (pasos 11–13)

- Sesión opaca del backend: login, `/auth/me`, logout 204, Bearer en memoria, volver al login al recargar/expirar. Mostrar navegación según roles del servidor, sin asumir que ocultar botones concede seguridad.
- Implementar recorridos por prioridad: requisición y lista/detalle → bandeja de aprobaciones y decisión → orden y envío → recepción y balance → factura conciliada, aprobación y pago → traslado → importación de observaciones con errores por fila → gasto, evaluación y reorden. Consultar documentos relacionados y estados del backend; no enviar PATCH de estado arbitrario por CRUD.
- CRUD de maestros solo cuando `backend/README.md` lo permite. Si faltan roles, cuentas, reglas o datos reales, presentar estado vacío útil y una explicación; nunca crear contraseñas o precios de muestra en la interfaz operativa.
- En pagos explicar que confirmar registra una referencia de pago externo y no transfiere dinero. Verificar `npm run build` tras cada bloque coherente.

## Fase 6 — Auditoría y entrega (paso 14)

- Revisar móvil, teclado, campos, mensajes 400/401/403/404/405/409/429/500/503, 204, carga, vacío, desconexión, permisos y recarga con token en memoria.
- Ejecutar `npm run build` y pruebas de servicios o recorridos que añadan valor. Si no se puede alcanzar la API en remoto, usar respuestas de prueba fieles al README y reportar la integración local como pendiente.
- Escribir `frontend/README.md` (comandos, variables, rutas, cómo comprobar con backend local) y `frontend/RESUMEN_IMPLEMENTACION.md` (pantallas/endpoints conectados, pruebas realizadas, limitaciones concretas y pantallas bloqueadas). Entregar un resumen honesto y la lista de archivos cambiados.

## Resultado esperado

El agente debe completar las fases secuencialmente hasta obtener un frontend compilable y un recorrido público y privado coherente con el backend real. Si encuentra una discrepancia bloqueante, documentar ruta, respuesta y archivo correspondiente, continuar las pantallas independientes y reportar lo que exige intervención en backend. No se considera completa una entrega formada solo por plan, scaffolding o mocks.
