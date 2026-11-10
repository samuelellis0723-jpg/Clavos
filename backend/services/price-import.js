'use strict';
const v = require('../lib/validation');
const { scaled, format } = require('../lib/decimal');
const { ApiError, fail } = require('../lib/errors');
const fields = ['supplier_product_id','observed_at','unit_price','currency_code','price_includes_tax','available_quantity','source_product_url','external_reference','is_validated'];
function validateRow(row) {
  v.object(row, fields, ['supplier_product_id','observed_at','unit_price','currency_code','price_includes_tax','is_validated']);
  const data = { ...row, supplier_product_id: v.id(row.supplier_product_id), observed_at: v.instant(row.observed_at), unit_price: format(scaled(row.unit_price, 4, { positive: true }), 4) };
  if (typeof row.price_includes_tax !== 'boolean' || typeof row.is_validated !== 'boolean') fail(400, 'INVALID_BOOLEAN', 'Impuesto y validación requieren booleanos.');
  if (!/^[A-Z]{3}$/.test(row.currency_code)) fail(400, 'INVALID_CURRENCY', 'Moneda inválida.');
  if (row.available_quantity != null) data.available_quantity = format(scaled(row.available_quantity, 3), 3);
  if (row.external_reference != null) data.external_reference = v.text(row.external_reference, 'external_reference', 150);
  if (row.source_product_url != null) {
    v.text(row.source_product_url, 'source_product_url', 500);
    let url;
    try { url = new URL(row.source_product_url); } catch { fail(400, 'INVALID_URL', 'URL de procedencia inválida.'); }
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) fail(400, 'INVALID_URL', 'Se requiere URL HTTP(S) sin credenciales.');
  }
  return data;
}
module.exports = db => ({
  async import(body, user) {
    v.object(body, ['price_source_id','price_basis','rows'], ['price_source_id','price_basis','rows']);
    if (body.price_basis !== 'per_purchase_unit') fail(400, 'PRICE_BASIS_REQUIRED', 'Declara price_basis=per_purchase_unit; disponibilidad en unidades de compra.');
    const sourceId = v.id(body.price_source_id), rows = v.lines(body.rows, 100);
    const source = await db.price_sources.findByPk(sourceId);
    if (!source || source.status !== 'active') fail(400, 'INVALID_SOURCE', 'La fuente debe existir y estar activa.');
    const batch = await db.price_import_batches.create({ price_source_id: sourceId, imported_by_user_id: user.user_id, records_received: rows.length, status: 'running' });
    try {
      return await db.sequelize.transaction(async transaction => {
        // Serializes imports for this source, including duplicate checks against legacy rows.
        const lockedSource = await db.price_sources.findByPk(sourceId, { transaction, lock: transaction.LOCK.UPDATE });
        if (lockedSource.status !== 'active') fail(409, 'INACTIVE_SOURCE', 'La fuente se desactivó.');
        const errors = []; let imported = 0;
        for (let index = 0; index < rows.length; index++) {
          try {
            await db.sequelize.transaction({ transaction }, async savepoint => {
              const data = validateRow(rows[index]);
              const equivalent = await db.supplier_products.findByPk(data.supplier_product_id, { transaction: savepoint,
                include: [{ model: db.suppliers, as: 'supplierId' }, { model: db.products, as: 'productId' }] });
              if (!equivalent || equivalent.status !== 'active' || equivalent.supplierId.status !== 'active' || equivalent.productId.status !== 'active' || !(Number(equivalent.pack_quantity) > 0)) fail(400, 'INVALID_EQUIVALENT', 'Producto equivalente o proveedor no activo.');
              const currency = await db.currencies.findByPk(data.currency_code, { transaction: savepoint });
              if (!currency || currency.status !== 'active') fail(400, 'INVALID_CURRENCY', 'Moneda no activa.');
              const duplicate = await db.supplier_price_observations.findOne({ where: { price_source_id: sourceId, supplier_product_id: data.supplier_product_id, observed_at: data.observed_at }, transaction: savepoint });
              if (duplicate) fail(409, 'DUPLICATE_OBSERVATION', 'Ya existe una observación de esa fuente, producto y fecha.');
              await db.supplier_price_observations.create({ ...data, price_source_id: sourceId, import_batch_id: batch.import_batch_id }, { transaction: savepoint });
            });
            imported++;
          } catch (error) {
            if (!(error instanceof ApiError) && !['SequelizeValidationError','SequelizeUniqueConstraintError'].includes(error.name)) throw error;
            errors.push({ row: index + 1, code: error.code || 'INVALID_ROW', message: error instanceof ApiError ? error.message : 'La fila no cumple el esquema.' });
          }
        }
        await batch.update({ status: errors.length === rows.length ? 'failed' : errors.length ? 'completed_with_errors' : 'completed', completed_at: new Date(), records_imported: imported, records_rejected: errors.length, error_summary: JSON.stringify({ version: 1, price_basis: body.price_basis, availability_basis: 'purchase_units', errors }) }, { transaction });
        return { import_batch_id: batch.import_batch_id, status: batch.status, records_received: rows.length, records_imported: imported, records_rejected: errors.length, errors };
      });
    } catch (error) {
      await batch.update({ status: 'failed', completed_at: new Date(), records_imported: 0, records_rejected: rows.length, error_summary: JSON.stringify([{ code: 'IMPORT_ROLLED_BACK', message: 'El lote se revirtió por un error de procesamiento.' }]) });
      throw error;
    }
  },
});
module.exports.validateRow = validateRow;
