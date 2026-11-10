# Decisiones explícitas y alcance del circuito

Estas políticas no estaban definidas completamente en el DBML. Son el contrato conservador del recorrido implementado, no afirmaciones de que Clavos ya las haya aprobado como política empresarial. Deben revisarse con responsables de compras/finanzas antes de producción. Cuando falta una política necesaria, la API rechaza la operación en vez de inventar precios, conversiones, aprobaciones o existencias.

## Montos, unidades y aprobación

- El circuito inicial admite monedas activas con `decimal_places = 2`, cantidades de hasta tres decimales y precios unitarios de hasta cuatro. Se usa aritmética entera escalada, no sumas de coma flotante. El esquema mantiene sus tipos DECIMAL originales.
- `tax_rate` es una **fracción**: `0.1300` representa 13 %. La API no elige una tasa fiscal. El operador debe proporcionar la tasa real. Cada subtotal de línea y su impuesto se redondean a centavos, mitad hacia arriba. `line_total` incluye el impuesto; los totales del encabezado suman esas líneas.
- La suma de `quantity_requested × estimated_unit_price` es el presupuesto total autorizado, incluidos los impuestos que deberá soportar la futura orden. El importe de la orden con impuestos no puede excederlo: tolerancia inicial cero. Un presupuesto insuficiente requiere una nueva requisición; no hay aumentos silenciosos.
- La unidad del producto debe permitir la fracción solicitada. En compras, `supplier_products.purchase_unit_id` debe coincidir con la unidad base y `pack_quantity = 1`. No hay tabla de conversión de unidades/presentaciones; las compras de cajas, equivalencias distintas y conversiones quedan bloqueadas hasta definirlas. El catálogo sí muestra otras presentaciones separadas.
- El centro de costo debe estar activo y pertenecer al departamento activo del solicitante. Productos, categorías, proveedores y monedas involucrados deben estar activos.
- Se seleccionan reglas activas de la misma moneda, vigentes el día UTC de envío, con departamento coincidente o sin departamento. Ambos límites de monto son inclusivos. Si dos reglas coinciden en el mismo `step_order`, el envío falla con `APPROVAL_POLICY_AMBIGUOUS`; no se elige una arbitrariamente. Los pasos se ordenan numéricamente y no tienen que ser consecutivos.
- Sin regla aplicable no hay aprobación automática. Se guarda cada paso en `requisition_approvals`. Las reglas usadas no se editan ni eliminan a través del CRUD; se crean nuevas reglas para nuevas políticas. El cambio de vigencia de reglas existentes requiere un procedimiento posterior revisado.
- Solo el solicitante envía su requisición. No puede autoaprobarla. En cada decisión se comprueba en MySQL el rol exigido por el paso pendiente. El rol técnico `admin` no sustituye el rol de aprobación. Una misma persona puede intervenir en distintos pasos si tiene los roles correspondientes; una separación adicional de aprobadores no está definida.

## Recorrido implementado

1. Crear requisición con sus líneas: `draft`.
2. Enviar: `submitted` y pasos pendientes.
3. Decidir cada paso: `under_review` mientras falten aprobaciones, `approved` al completar, o `rejected` al rechazar.
4. Crear una única orden por requisición aprobada, con todas sus líneas y un único proveedor. La orden queda `draft`; la requisición, `ordered`.
5. Marcar el envío: `sent`. Esto registra una acción del operador; **no envía correo ni pedidos al proveedor**.
6. Registrar recepciones `posted`. Se permiten entregas parciales. Aceptado + rechazado debe igualar recibido, sin superar el pendiente aceptable de la orden en esa entrega. Un rechazo requiere motivo. El reemplazo de unidades rechazadas puede recibirse después. La orden avanza a `partially_received` o `received`. Solo las cantidades aceptadas de productos inventariables generan entradas de stock, dentro de la misma transacción.
7. Registrar la factura **real**, proporcionando cantidades, precios, impuestos y totales. Solo después de recibir completamente la orden y con coincidencia exacta: una factura completa por orden, estado `matched`. Se guardan líneas y asignaciones a recepciones. Una discrepancia se rechaza; no se fabrican valores de una factura a partir de una cotización.
8. Finanzas aprueba la factura: `approved`.
9. Programar un pago completo de esa factura, misma moneda: `scheduled`.
10. Finanzas confirma fecha y referencia del pago externo: pago `completed`, factura `paid`. **No hay integración bancaria ni movimiento real de dinero.** La confirmación es responsabilidad del operador.

Recepciones, movimientos, facturas, pagos y decisiones no se borran ni se alteran con CRUD genérico. Los servicios bloquean los documentos afectados con `FOR UPDATE`; las escrituras relacionadas se realizan en una transacción. Un error revierte la operación. Si MySQL detecta un deadlock/timeout de bloqueo se devuelve `409 RETRY_TRANSACTION`; el cliente debe releer el documento antes de reintentar. Los números únicos de documento y las comprobaciones de estado impiden repetir una recepción o pago completado. No existe una garantía general de idempotencia con respuesta idéntica: un reintento puede devolver 409.

## Inventario y cálculos

- El stock es la suma de `inventory_movement_lines.quantity_change`; disponible = stock menos reservas no liberadas ni expiradas. No se deduce stock a partir de órdenes pendientes.
- Los traslados generan una salida y entrada de igual cantidad en una transacción; bloquean el producto y verifican saldo disponible. No se transfieren cantidades reservadas. Un producto con movimientos por lote exige una selección de lotes todavía no implementada.
- Las entradas por recepción usan el costo neto de la línea. Los traslados conservan cantidades, pero dejan costos sin asignar: FIFO/promedio, capitalización de impuestos y valuación contable requieren política empresarial.
- Gasto: suma de líneas de facturas aprobadas, parcialmente pagadas o pagadas, agrupada por categoría y moneda. Fecha de referencia: fecha de factura. No mezcla monedas ni pretende ser flujo de caja.
- Evaluación: promedio ponderado calculado desde scores y pesos existentes. Se devuelve el peso total y los criterios originales. Sin escala común ni normalización de `higher_is_better`, no se produce un ranking de proveedores. No se crean scores ficticios. La captura/aprobación de evaluaciones permanece bloqueada hasta definir escala, pesos, dirección y evidencias.
- Reorden: demanda diaria almacenada × plazo almacenado + stock de seguridad almacenado; muestra saldo disponible y fecha de la política. Si faltan demanda/plazo, devuelve `null` y requisitos faltantes. No infiere consumo a partir de compras, ni presenta parámetros antiguos como recién recalculados.

## Pendientes bloqueados o limitados

- Órdenes divididas entre proveedores, consolidación, contratos automáticos, compras fuera de requisición, sobrepresupuesto y conversión monetaria/unidades.
- Editar requisiciones/órdenes en borrador, cancelar/reabrir documentos, cierres administrativos, devoluciones, notas de crédito, tolerancias de factura, varias facturas por orden, anticipos/pagos parciales y segregación adicional de funciones financieras.
- Captura/ajuste de inventario inicial, ventas, lotes y vencimientos, reservas/liberaciones, políticas de conteo/ajuste y valuación. No hay tablas de ventas en el DBML; no se inventaron.
- Detectores automáticos de anomalías: faltan umbrales, periodos comparables, benchmark contractual y reglas de revisión. El endpoint de gasto realiza agregación de datos reales, no detección simulada.
- Catálogo de permisos empresarial y acceso entre departamentos: se implementaron roles técnicos explícitos. Los responsables deben confirmar su asignación. Las aprobaciones usan los roles reales indicados por las reglas existentes.
- Los registros históricos previos pueden tener convenciones distintas. Deben auditarse antes de operarlos con estos servicios. Se bloquean estados inconsistentes; no se corrigen cantidades, montos o precios históricos automáticamente.
