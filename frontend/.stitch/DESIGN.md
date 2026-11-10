# Design System: Ferretería Clavos — Catálogo y Sistema Operativo de Abastecimiento

> **Nota sobre el entorno de ejecución:** Este sistema de diseño fue generado localmente aplicando las directrices de `.agents/skills/frontend-design/SKILL.md` (ancla **Swiss**) y `.agents/skills/taste-design/SKILL.md`, ya que el entorno actual no cuenta con herramientas autenticadas de **Stitch MCP** (`StitchMCP`). Todas las reglas semánticas, tokens de color, arquitectura tipográfica, accesibilidad y preferencias de movimiento reducido están codificadas directamente en este documento y en el CSS de la aplicación.

## 1. Visual Theme & Atmosphere

- **Anchor (`frontend-design`):** **Swiss** — Superficie blanca pura (`#FFFFFF`) y neutra fría (`#F7F7F8`), tipografía sans-serif de carácter técnico con números tabulares (`tabular-nums`) para cantidades, precios y códigos, estructura gobernada por una cuadrícula visible de líneas de `1px` (*hairline rules*), alineación izquierda rigurosa y un único acento azul (`#002FA7`, Yves Klein Blue).
- **Differentiator:** **Cuadrícula técnica con folios numerados y fichas de especificación a sangre** — cada módulo del catálogo, grupo de comparación de precios y paso del circuito operativo (requisición → aprobación → orden → recepción → factura → pago) se presenta dentro de celdas delimitadas por bordes estructurales de `1px` con numeración de orden (`01`, `02`, `03`), metadatos en monoespaciado tabular y advertencias contractuales explícitas integradas en la propia retícula.
- **Density:** `7/10` (Equilibrio entre catálogo público legible y cabina operativa de compras/finanzas con alta densidad de cifras decimales).
- **Variance:** `6/10` (Retícula asimétrica alineada a la izquierda; sin héroes centrados ni tarjetas decorativas flotantes).
- **Motion:** `4/10` (Transiciones físicas suaves en `transform` y `opacity`, con respeto absoluto por `@media (prefers-reduced-motion: reduce)`).

## 2. Color Palette & Roles

- **Pure Surface** (`#FFFFFF`) — Superficie primaria de celdas, tablas, formularios y cabeceras.
- **Neutral Canvas** (`#F7F7F8`) — Superficie base de aplicación, fondos secundarios de agrupación y cabeceras de tabla.
- **Charcoal Ink** (`#18181B`) — Texto primario (Zinc-950, nunca negro puro `#000000`).
- **Muted Steel** (`#52525B`) — Texto secundario, etiquetas técnicas, metadatos y descripciones (`AA` garantizado sobre `#FFFFFF` y `#F7F7F8`).
- **Hairline Grid** (`#E4E4E7`) — Líneas estructurales de `1px` que definen la cuadrícula suiza, divisores de fila y contornos de controles.
- **Strong Rule** (`#18181B`) — Líneas de énfasis superior (`2px`) en secciones activas o encabezados de documento.
- **Klein Accent Blue** (`#002FA7`) — Único color de acento para acciones primarias (CTAs), enlaces activos, indicadores de paso actual y anillos de foco (`:focus-visible`).
- **Semantic Status Colors (Calibrados sin neón):**
  - **Validated / Approved** (`#15803D` texto / `#F0FDF4` fondo / `#BBF7D0` borde) — Estado activo, aprobado, recibido o conciliado.
  - **Warning / Stale / Pending** (`#B45309` texto / `#FFFBEB` fondo / `#FDE68A` borde) — Observación antigua (`stale`), política de edad no configurada (`age_policy_not_configured`), borrador o paso pendiente.
  - **Critical / Rejected / Error** (`#B91C1C` texto / `#FEF2F2` fondo / `#FECACA` borde) — Errores HTTP (`400`, `401`, `403`, `404`, `405`, `409`, `429`, `500`, `503`), rechazos o discrepancias.

## 3. Typography Rules

- **Primary Sans Stack:** `'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif` — Escala controlada, tracking ajustado (`-0.02em` en titulares), jerarquía conducida por peso (`500`, `600`, `700`) y posición en la retícula.
- **Technical & Numeric Mono Stack:** `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` — Obligatorio para SKUs, códigos de moneda (`CRC`, `USD`), precios unitarios (4 decimales), cantidades (3 decimales), totales monetarios (2 decimales), fechas ISO UTC y folios de documento, siempre con `font-variant-numeric: tabular-nums`.
- **Body Copy:** Altura de línea `1.5`, ancho máximo de lectura `65ch` en bloques explicativos y advertencias de negocio.
- **Banned:** Fuentes serif en interfaces operativas, texto centrado en encabezados, gradientes en textos o fondos cálidos color crema.

## 4. Component Stylings

- **Buttons:** Rectangulares de precisión suiza (`border-radius: 2px`), altura táctil mínima de `44px`, sin resplandores exteriores. Estado activo con traslación táctil (`transform: translateY(1px)`). Variante primaria en `#002FA7` con texto `#FFFFFF`; variante secundaria con fondo `#FFFFFF` y borde `#18181B` o `#E4E4E7`.
- **Grid Cells & Panels:** En lugar de tarjetas flotantes con sombras difusas, los contenedores se integran en la cuadrícula mediante bordes de `1px solid #E4E4E7` y divisores superiores de `2px solid #18181B` cuando representan documentos formales (requisición, orden, recepción, factura, comprobante de pago).
- **Inputs & Selects:** Etiqueta explícita encima del control (`label`), texto de ayuda técnico opcional y mensaje de error debajo del campo con borde `#B91C1C`. Altura mínima `44px`, anillo de foco visible de `2px solid #002FA7` con `outline-offset: 2px`.
- **Skeletal Loaders:** Bloques rectangulares con pulso de opacidad suave que respetan exactamente la geometría de las filas o celdas antes de recibir datos; sin spinners circulares genéricos.
- **Empty States:** Composiciones estructuradas que explican la causa real (ej. catálogo sin productos activos, producto sin observaciones validadas o bandeja sin aprobaciones para los roles del usuario) y ofrecen la acción correspondiente.
- **Confirmation Modals:** Diálogo accesible (`role="dialog"`, `aria-modal="true"`, cierre con `Escape` y foco controlado) obligatorio antes de acciones irreversibles: enviar requisición, emitir decisión de aprobación/rechazo, enviar orden, registrar recepción, aprobar factura, confirmar referencia de pago externo o eliminar un maestro permitido.

## 5. Layout Principles

- **Grid-First Architecture:** Uso de CSS Grid con brechas de `1px` sobre fondo `#E4E4E7` para formar retículas de líneas continuas (`hairline grid`), contenido dentro de un ancho máximo de `1440px`.
- **Asymmetric Header & Split Views:** Encabezados alineados a la izquierda con metadatos de contexto o folios numerados en la columna complementaria.
- **Responsive Collapse (`< 768px`):** Todas las cuadrículas multicolumna colapsan a una sola columna sin desbordamiento horizontal; las tablas anchas se envuelven en contenedores desplazables accesibles con indicadores claros.
- **Viewport Stability:** Uso de `min-height: 100dvh` para el contenedor raíz de la aplicación.

## 6. Motion & Interaction

- **Hardware-Accelerated Transitions:** Solo se animan `transform` y `opacity` (`150ms cubic-bezier(0.22, 1, 0.36, 1)`).
- **Reduced Motion Compliance:** Bajo `@media (prefers-reduced-motion: reduce)`, todas las animaciones y transiciones se desactivan o reducen a cambios instantáneos, garantizando comodidad visual y accesibilidad.

## 7. Anti-Patterns & Content Discipline (Banned)

- **Prohibido inventar datos de negocio:** Nunca mostrar precios ficticios de EPA ni de otros proveedores, ni métricas falsas, ni nombres genéricos (`John Doe`, `Acme`), ni cuentas o contraseñas de demostración.
- **Prohibido mezclar grupos de comparación:** Nunca ordenar ni declarar un "mejor precio" entre ofertas con distinto `comparison_group` o con `price_basis: "unconfirmed_legacy_basis"`.
- **Prohibido prometer vigencia:** Nunca ocultar que `is_current_price_guaranteed` es `false` ni que las observaciones de precios son históricas.
- **Prohibido usar emojis o glifos Unicode como iconos decorativos:** Usar iconos SVG limpios o etiquetas tipográficas directas.
- **Prohibido convertir decimales a `Number` para cálculos financieros:** Usar siempre cadenas decimales y aritmética `BigInt` escalada para previsualizaciones de subtotales e impuestos.
