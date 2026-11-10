# Mercado Libre Costa Rica: precios reales

Este conector consulta la API oficial de Mercado Libre. No realiza scraping ni inventa productos o precios. Solo procesa equivalencias de publicaciones `MCR` que un administrador haya revisado y vinculado antes en Clavos. Una cuenta y una aplicación de Mercado Libre deben proporcionar credenciales OAuth válidas; no hay tokens en el repositorio.

Documentación oficial: [búsqueda pública de ítems](https://developers.mercadolibre.co.cr/en_us/introduction-vehicles/items-and-searches), [precio de venta](https://developers.mercadolibre.co.cr/api-de-precios), [autenticación y renovación](https://developers.mercadolibre.co.cr/en_us/introduction-vehicles/authentication-and-authorization).

## Preparación en MySQL

Aplica las migraciones del proyecto y crea los registros maestros mediante los endpoints administrativos existentes, en este orden:

1. Moneda activa `CRC` y fuente activa con `source_name` **exactamente** `Mercado Libre Costa Rica`, `source_type: "api"`, `base_url: "https://api.mercadolibre.com"`.
2. Producto interno `products` normalizado, con su categoría y unidad. Revisa que realmente corresponde a la publicación que vas a vincular.
3. Proveedor en `suppliers` con `supplier_code: "ML-<seller_id>"` (el ID numérico del vendedor devuelto por `/items/{id}`). Cada vendedor distinto es un proveedor distinto en Clavos.
4. Equivalencia `supplier_products` entre ese proveedor y el producto interno. `supplier_sku` debe ser el ID real `MCR...` de la publicación, `currency_code: "CRC"` y `pack_quantity`/`purchase_unit_id` deben reflejar la presentación real. No se infiere una equivalencia por similitud del título.

El conector rechaza publicaciones inactivas, fuera de MCR, de otro vendedor, con precio/moneda inválidos o URL de otro dominio. La API de Mercado Libre no confirma por sí sola si el precio incluye el impuesto o la equivalencia de unidades: el operador debe verificar esos datos antes de activar la captura. `available_quantity` queda sin declarar.

## Credenciales

En `backend/.env`, configura `MELI_PRICE_INCLUDES_TAX` explícitamente como `true` o `false` tras verificarlo. `MELI_MAX_ITEMS` limita los equivalentes por ejecución (1 a 100). El proceso se detiene si hay más equivalencias que el límite para no omitir productos silenciosamente.

- Prueba puntual: `MELI_ACCESS_TOKEN` válido. Caduca; no se renueva si se establece esta variable.
- Cron: `MELI_CLIENT_ID`, `MELI_CLIENT_SECRET` y `MELI_REFRESH_TOKEN` inicial. Deja `MELI_ACCESS_TOKEN` vacío. Obtén el refresh token mediante el flujo OAuth oficial de tu aplicación; no lo copies al chat ni al repositorio.
- El proceso guarda el access token y el refresh token rotado en `backend/.mercado-libre-token.json` con permisos `0600`. Este archivo está ignorado por Git. Conserva una copia privada segura; Mercado Libre invalida el refresh token anterior al renovarlo. Ejecuta solo una instancia del trabajo a la vez. Si se pierde el archivo tras una renovación, se requiere un nuevo flujo de autorización.

```bash
cd backend
npm ci
npm run db:migrate
npm run prices:sync:mercadolibre
npm run test:mercadolibre
```

Para automatizarlo en Linux, ejecuta `npm run prices:sync:mercadolibre` diariamente con cron usando una ruta absoluta y sin trabajos solapados. Ejemplo de crontab, después de sustituir la ruta:

```cron
15 7 * * * cd /ruta/Clavos/backend && /usr/bin/flock -n /tmp/clavos-mercadolibre.lock /usr/bin/npm run prices:sync:mercadolibre >> /ruta/privada/mercadolibre-sync.log 2>&1
```

No configures el cron hasta completar la equivalencia y las credenciales. El proceso consulta `/items/{id}` y `/items/{id}/sale_price?context=channel_marketplace` para cada publicación, captura la fecha UTC actual, reutiliza la importación transaccional existente y guarda una fila nueva en `supplier_price_observations` por ejecución. Los fallos por publicación se incluyen en `price_import_batches.error_summary`; las demás publicaciones continúan. Los errores de credenciales o conexión global hacen fallar la ejecución y requieren intervención. `source_product_url` apunta a la publicación de procedencia.

Se usa el precio por **una unidad de compra**. No se incluye envío, variaciones de comprador, descuentos por cantidad ni conversiones de moneda. La captura es histórica y no garantiza el precio actual. Esta integración cubre **una fuente**: para cumplir el requisito académico de dos fuentes automáticas todavía hay que añadir otra API/fuente autorizada. También siguen pendientes las alertas por variación y el ranking del endpoint de comparación.
