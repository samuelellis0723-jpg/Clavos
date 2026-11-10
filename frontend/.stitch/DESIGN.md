# Sistema de diseño: Ferretería Clavos — "Taller editorial"

> **Nota de entorno:** Stitch MCP no está autenticado en el entorno donde se redactó esta guía. El sistema se definió y aplicó directamente en `src/index.css` y en los componentes React. Si Stitch se habilita más adelante, esta guía es la fuente de verdad para generar pantallas.

> **Por qué se reemplazó la guía anterior:** la versión previa imponía una retícula suiza de líneas de 1 px en toda la aplicación, prohibía héroes, fotografía, recursos gráficos y tipografía expresiva, y obligaba a usar monoespaciado en casi todos los textos. El resultado era una consola técnica incluso en la parte pública. Esta guía separa dos registros, **público editorial** y **panel de trabajo**, que comparten la misma identidad.

---

## 1. Idea de marca

**Clavos es el taller ordenado.** Herramientas y materiales presentados como en una revista: fotografía protagonista, titulares con carácter industrial y mucho aire. La información comercial siempre es honesta: observaciones históricas de precio, con fecha, proveedor y presentación visibles.

- **Público (inicio, catálogo, ficha, comparación):** composición editorial, fotografía o ilustración de marca, titulares grandes, espacios amplios, llamadas a la acción claras.
- **Panel privado (`/app/*`):** la misma paleta y tipografía, pero sobria y densa cuando hace falta. Tarjetas limpias, tablas legibles, formularios claros. Nada de héroes ni fotografía decorativa.

Referencias de actitud: la claridad de Apple (una idea por pantalla, jerarquía obvia) y la presentación editorial de Zara (imagen grande, tipografía con aplomo, márgenes generosos). Identidad propia: grafito, concreto y naranja de señalización. Nada de tonos pastel ni cremas de pastelería.

## 2. Paleta

| Rol | Token | Valor | Uso |
| --- | --- | --- | --- |
| Grafito (tinta) | `--ink` | `#141518` | Texto principal, superficies oscuras, footer |
| Grafito 2 | `--ink-2` | `#2A2D33` | Superficies oscuras secundarias |
| Acero | `--steel` | `#5B6068` | Texto secundario (6.3:1 sobre blanco) |
| Acero 2 | `--steel-2` | `#6B7078` | Metadatos (≈5:1 sobre blanco) |
| Línea | `--line` | `#E2E2DE` | Divisores y bordes suaves |
| Concreto | `--canvas` | `#F3F3F0` | Fondo de aplicación |
| Concreto 2 | `--concrete` | `#E9E9E5` | Láminas de producto e ilustración |
| Superficie | `--surface` | `#FFFFFF` | Tarjetas, tablas, formularios |
| Naranja señal | `--signal` | `#E8501C` | Bloques gráficos, acentos grandes, texto grande sobre grafito |
| Naranja fuerte | `--signal-strong` | `#C2410C` | Botón primario con texto blanco (5.2:1) y enlaces |
| Naranja profundo | `--signal-deep` | `#9A330A` | Hover y presionado |
| Naranja sobre oscuro | `--signal-on-dark` | `#FF7A45` | Texto de acento sobre grafito (7:1) |
| Cinta métrica | `--tape` | `#F2C230` | Anillo de foco sobre fondos oscuros, detalle puntual |

Los estados (éxito, aviso, error e información) usan tonos calibrados con contraste AA. **Nunca** se usa el naranja como color de error: el error tiene su propio rojo.

## 3. Tipografía

- **Titulares:** `Archivo Variable` con anchura expandida (`font-stretch: 112–125%`), peso 700–800 y tracking negativo. Da el carácter industrial de un rótulo de taller.
- **Interfaz y lectura:** `Inter Variable`, 400–600, interlineado de 1.5 y ancho de lectura de unos 65ch.
- **Monoespaciado:** `JetBrains Mono Variable` **solo** para SKU, códigos de barras, precios observados, cantidades, monedas, fechas UTC y folios. Siempre con `tabular-nums`. No se usa en etiquetas ni en párrafos.
- Las fuentes se empaquetan con `@fontsource` (sin dependencia de CDN).

Escala pública: display `clamp(2.6rem, 6vw, 5.25rem)`, H2 `clamp(1.75rem, 3.2vw, 2.75rem)`. Escala del panel: título de página `clamp(1.5rem, 2.4vw, 2rem)` y encabezados de sección de 1.1 a 1.25rem.

## 4. Imagen y recursos gráficos

- **Fotografía editorial de marca** (`src/assets/editorial/*.webp`): composiciones de herramientas y materiales genéricos sobre concreto y grafito, con un bloque naranja como firma. Se usa en la portada, el catálogo, las bandas editoriales y el login. Cada imagen lleva un pie que aclara que es una **composición editorial** y que no representa productos del catálogo.
- **Láminas de producto (`ProductPlate`):** la API no entrega imágenes de producto. Cada producto se muestra con una lámina ilustrada: un pictograma de línea según la categoría (fijaciones, herramienta manual, plomería, pintura, electricidad, madera, construcción, jardín, seguridad o genérico) y el SKU. **Nunca** se simula una foto real del producto.
- Pictogramas SVG propios con trazo de 1.5–2 px. Sin emojis.

## 5. Composición

- Contenedor `--wrap: 1320px` con margen lateral `clamp(1rem, 4vw, 2.5rem)`.
- **Público:** secciones a sangre con ritmo vertical amplio (`clamp(4rem, 9vw, 8rem)`), héroe dividido en texto e imagen, bandas oscuras alternas y rejillas de producto de 1, 2, 3 o 4 columnas según el ancho.
- **Panel:** barra lateral de módulos agrupados (compra, existencias, finanzas, análisis y administración) que en tablet y móvil pasa a una tira horizontal desplazable. Contenido en tarjetas blancas con radio de 12 px y borde `--line`.
- Puntos de corte: 640, 860, 1024 y 1280 px.

## 6. Componentes

- **Botones:** radio de 999 px (píldora) en la parte pública y de 10 px en el panel. Altura mínima de 44 px. Primario en `--signal-strong` con texto blanco, secundario con borde `--line-strong` y botón oscuro en `--ink`.
- **Campos:** etiqueta visible encima, 44 px de alto, radio de 10 px y foco con un anillo de 3 px en naranja translúcido más el borde naranja.
- **Insignias:** píldoras pequeñas en Inter. El tono acompaña el estado.
- **Tarjeta de producto:** lámina ilustrada arriba, categoría, nombre, marca y modelo, SKU en mono, unidad y dos acciones: "Ver ficha" y "Comparar precios".
- **Grupo de comparación:** cabecera con las cuatro condiciones del grupo (unidad de compra, presentación, moneda e impuestos). En escritorio las ofertas se muestran en tabla y en móvil, en fichas apiladas. Cada oferta muestra proveedor, presentación, precio observado con moneda e impuesto, fecha UTC, antigüedad, frescura, fuente y "precio actual no garantizado".
- **Estados:** esqueletos con pulso suave, estados vacíos que explican la causa real y errores con código HTTP y opción de reintento.
- **Modales:** `role="dialog"`, `aria-modal`, cierre con Escape y foco controlado.

## 7. Movimiento

- Entrada suave del héroe (opacidad y desplazamiento de 12 px, 600 ms), elevación de tarjetas al pasar el cursor (−3 px) y zoom leve de la imagen (1.03).
- Solo se animan `transform` y `opacity`. Curva `cubic-bezier(.22, 1, .36, 1)`.
- `@media (prefers-reduced-motion: reduce)` desactiva todas las animaciones y transiciones.

## 8. Accesibilidad

- Contraste AA en todo texto y anillo de foco visible (`:focus-visible`), en naranja sobre fondos claros y en amarillo cinta sobre oscuros.
- Enlace "Saltar al contenido", navegación móvil con `aria-expanded` y cierre con Escape.
- Objetivos táctiles de al menos 44 px.
- Imágenes decorativas con `alt=""` y fotografías editoriales con `alt` descriptivo y pie aclaratorio.

## 9. Disciplina de contenido (obligatorio)

- **No inventar datos:** ni precios, ni proveedores, ni existencias, ni métricas, ni fotos de producto. Las cifras visibles provienen de la API.
- **No mezclar grupos:** solo se comparan ofertas con el mismo `comparison_group`. Las observaciones `unconfirmed_legacy_basis` van aparte, sin orden por precio.
- **No prometer vigencia:** siempre se muestra que `is_current_price_guaranteed` es falso y que las observaciones son históricas, con fecha y antigüedad.
- **No usar `Number` para dinero:** los montos se muestran como cadenas decimales y los cálculos usan `BigInt` escalado (`services/decimal.js`).
- **Sin cuentas demo** ni contraseñas en la interfaz.
