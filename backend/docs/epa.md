# Precios externos y EPA

Revisión realizada el 9 de noviembre de 2026. Se consultaron búsqueda de documentación API en el dominio oficial, la página de contacto y referencias oficiales de condiciones de uso. No se verificó una API oficial documentada con autorización y credenciales disponibles para este proyecto. Esto no demuestra que EPA no tenga integraciones privadas: para automatizar precios se necesita que EPA proporcione contrato, documentación y autorización de acceso.

Fuentes consultadas:

- Contacto oficial Costa Rica: https://cr.epaenlinea.com/contact/
- Documento oficial de términos disponible en el dominio de documentos de Costa Rica: https://docscr.epaenlinea.com/cr/documentos/terminos-condiciones-tel-2022.pdf
- La URL https://cr.epaenlinea.com/terminos-condiciones no pudo abrirse con la herramienta de consulta; no se presenta como una comprobación de términos actuales.

La API **no hace scraping**, no llama endpoints privados de la tienda ni tiene un cron de actualización. No se importaron datos ni precios de EPA en desarrollo. Los datos de pruebas son sintéticos, identificados como tales, y se revierten en MySQL.

## Importación autorizada de datos reales

`POST /api/admin/price-imports` requiere sesión con rol `admin`. El proveedor, su producto equivalente, la moneda y la fuente deben existir y estar activos. La fuente se registra con `price_sources`; `source_name` identifica la procedencia real. No debe etiquetarse una fuente como EPA si los datos no proceden de EPA y no se tiene derecho a utilizarlos.

Se recibe un JSON con `price_source_id`, `price_basis: "per_purchase_unit"` y hasta 100 filas. El administrador declara explícitamente que `unit_price` corresponde a la unidad de compra de `supplier_products`, y `available_quantity` a unidades de esa misma presentación. `price_includes_tax` e `is_validated` son booleanos explícitos; marcar validado implica haber contrastado la observación. La API valida estructura y referencias, no puede certificar que un precio externo sea verdadero.

Cada fila incluye `supplier_product_id`, `observed_at` UTC con precisión de segundos, `unit_price`, `currency_code`, `price_includes_tax`, `is_validated`; puede incluir `available_quantity`, `source_product_url` y `external_reference`. Solo se aceptan URLs HTTP(S) sin credenciales; se almacenan sin visitarlas. `observed_at` no puede ser futuro. Los decimales son cadenas, con hasta cuatro decimales para precio y tres para cantidad.

Se conserva un lote con usuario, fuente, inicio, fin, conteos y errores por número de fila. La identidad duplicada es **fuente + producto equivalente + fecha de observación**. Una observación repetida se rechaza aunque cambie el precio; nunca se reemplaza la original. Se bloquea la fuente durante la importación para serializar esa comprobación. Cada fila usa un savepoint; un error de infraestructura revierte las filas del lote y marca el lote fallido.

`error_summary` conserva un sobre JSON versionado con `price_basis`, `availability_basis` y `errors`; no se añadieron columnas de precios al DBML. El estado del lote puede ser `completed`, `completed_with_errors` o `failed`. Un lote con filas rechazadas sigue respondiendo HTTP 201 porque el recurso lote se creó; el cliente debe mostrar `records_rejected` y `errors`.

## Presentación pública

- Solo productos, proveedores, equivalentes, fuentes y monedas activos, y observaciones validadas no futuras.
- Se usa la observación válida más reciente disponible por producto equivalente. La observación es histórica, no una garantía del precio actual.
- Se expone fecha y edad. Sin `PRICE_MAX_AGE_HOURS`, `freshness` es `age_policy_not_configured`. Con política explícita: `recent_observation` o `stale`. Incluso una observación reciente conserva `is_current_price_guaranteed: false`.
- Solo se pueden comparar ofertas con el mismo `comparison_group`: unidad de compra, cantidad por presentación, moneda y tratamiento de impuesto idénticos. No se ordenan por precio globalmente ni se convierten monedas ni se normalizan unidades.
- Un precio histórico sin metadatos de base confirmada devuelve `price_basis: "unconfirmed_legacy_basis"` y `comparison_group: null`. Su precio y fecha siguen visibles, pero no debe usarse para ranking. Para habilitar comparación se importa una nueva observación real con su base declarada.
- La disponibilidad es la observada en esa fecha, no el stock actual de EPA ni el inventario de Clavos. Si no hay observaciones aptas se devuelve `offers: []`.
