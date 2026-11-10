'use strict';
const { Op, fn, col, where: sqlWhere } = require('sequelize');
const v = require('../lib/validation');
const { fail } = require('../lib/errors');
const { scaled, format } = require('../lib/decimal');
const productAttributes = ['product_id','sku','name','description','brand','model','barcode','unit_id','category_id','is_stockable'];
function productDTO(instance) {
  const x = instance.toJSON ? instance.toJSON() : instance;
  const { categoryId, unitId, ...product } = x;
  return { ...product, category: categoryId, unit: unitId };
}
function publicUrl(value) {
  try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? value : null; } catch { return null; }
}
function offerDTO(sp, observation, now = new Date(), maxAgeHours = process.env.PRICE_MAX_AGE_HOURS) {
  const age = Math.max(0, Math.floor((now - new Date(observation.observed_at)) / 1000));
  const threshold = maxAgeHours !== '' && Number(maxAgeHours) > 0 ? Number(maxAgeHours) : null;
  let provenance;
  try { provenance = JSON.parse(observation.importBatchId?.error_summary || 'null'); } catch { provenance = null; }
  const confirmedBasis = provenance?.version === 1 && provenance?.price_basis === 'per_purchase_unit';
  const pack = format(scaled(sp.pack_quantity, 3, { positive: true, precision: 12 }), 3);
  return {
    supplier_product_id: sp.supplier_product_id, supplier: sp.supplierId,
    supplier_sku: sp.supplier_sku, supplier_product_name: sp.supplier_product_name,
    purchase_unit: sp.purchaseUnitId, pack_quantity: pack,
    minimum_order_quantity: sp.minimum_order_quantity, lead_time_days: sp.lead_time_days,
    price_observation_id: observation.price_observation_id,
    unit_price: format(scaled(observation.unit_price, 4), 4),
    currency_code: observation.currency_code, price_includes_tax: observation.price_includes_tax,
    observed_at: new Date(observation.observed_at).toISOString(), age_seconds: age,
    freshness: threshold === null ? 'age_policy_not_configured' : age > threshold * 3600 ? 'stale' : 'recent_observation',
    is_current_price_guaranteed: false,
    available_quantity: observation.available_quantity,
    source_product_url: publicUrl(observation.source_product_url),
    source: observation.priceSourceId,
    price_basis: confirmedBasis ? 'per_purchase_unit' : 'unconfirmed_legacy_basis',
    comparison_group: confirmedBasis ? `${sp.purchase_unit_id}|${pack}|${observation.currency_code}|${observation.price_includes_tax ? 'tax_included' : 'tax_excluded'}` : null,
  };
}
module.exports = function catalog(db) {
  const include = [
    { model: db.expense_categories, as: 'categoryId', attributes: ['category_id','code','name'], where: { status: 'active' } },
    { model: db.units_of_measure, as: 'unitId', attributes: ['unit_id','code','name','allows_decimal'], required: true },
  ];
  async function get(productId) {
    const row = await db.products.findOne({ where: { product_id: v.id(productId), status: 'active' }, attributes: productAttributes, include });
    if (!row) fail(404, 'NOT_FOUND', 'Producto no encontrado.');
    return productDTO(row);
  }
  return {
    async list(query) {
      const pg = v.page(query, ['q','category_id','unit_id','brand']);
      const where = { status: 'active' };
      for (const k of ['category_id','unit_id']) if (query[k] !== undefined) where[k] = v.id(query[k], k);
      if (query.brand !== undefined) where.brand = v.text(query.brand, 'brand', 100);
      if (query.q !== undefined) {
        const term = v.text(query.q, 'q', 100);
        where[Op.or] = ['name','sku','barcode'].map(k => sqlWhere(fn('LOCATE', term, col(`products.${k}`)), { [Op.gt]: 0 }));
      }
      const result = await db.products.findAndCountAll({ where, attributes: productAttributes, include, distinct: true, limit: pg.limit, offset: pg.offset, order: [['product_id','ASC']] });
      return { data: result.rows.map(productDTO), pagination: { page: pg.page, limit: pg.limit, total: result.count } };
    },
    get,
    async compare(productId, query) {
      const product = await get(productId), pg = v.page(query);
      const now = new Date();
      const result = await db.supplier_products.findAndCountAll({
        where: { product_id: product.product_id, status: 'active' },
        attributes: ['supplier_product_id','supplier_sku','supplier_product_name','purchase_unit_id','pack_quantity','minimum_order_quantity','lead_time_days'],
        include: [
          { model: db.suppliers, as: 'supplierId', attributes: ['supplier_id','legal_name','trade_name'], where: { status: 'active' } },
          { model: db.units_of_measure, as: 'purchaseUnitId', attributes: ['unit_id','code','name'] },
          { model: db.supplier_price_observations, as: 'supplierPriceObservationsBySupplierProductId', separate: true, limit: 1,
            where: { is_validated: true, observed_at: { [Op.lte]: now } }, order: [['observed_at','DESC'],['price_observation_id','DESC']],
            attributes: ['price_observation_id','supplier_product_id','unit_price','currency_code','price_includes_tax','observed_at','available_quantity','source_product_url','import_batch_id'],
            include: [
              { model: db.price_import_batches, as: 'importBatchId', attributes: ['error_summary'], required: false },
              { model: db.price_sources, as: 'priceSourceId', attributes: ['price_source_id','source_name','source_type'], where: { status: 'active' } },
              { model: db.currencies, as: 'currencyCode', attributes: [], where: { status: 'active' } },
            ] },
        ], distinct: true, limit: pg.limit, offset: pg.offset, order: [['supplier_product_id','ASC']],
      });
      const offers = result.rows.flatMap(row => {
        const sp = row.toJSON(), observation = sp.supplierPriceObservationsBySupplierProductId[0];
        // Do not infer equivalence for invalid legacy presentation metadata.
        if (!observation || !(Number(sp.pack_quantity) > 0)) return [];
        return [offerDTO(sp, observation, now)];
      });
      return { data: { product, offers }, pagination: { page: pg.page, limit: pg.limit, total_supplier_products: result.count }, meta: { price_basis: 'per_purchase_unit', ranking: 'none', conversion: 'none', presentation_policy: 'compare_only_equal_comparison_group', availability_basis: 'purchase_units_at_observed_at' } };
    },
    async categories(query) {
      const pg = v.page(query);
      const result = await db.expense_categories.findAndCountAll({ where: { status: 'active' }, attributes: ['category_id','parent_category_id','code','name'], limit: pg.limit, offset: pg.offset, order: [['category_id','ASC']] });
      return { data: result.rows, pagination: { page: pg.page, limit: pg.limit, total: result.count } };
    },
  };
};
module.exports.offerDTO = offerDTO;
