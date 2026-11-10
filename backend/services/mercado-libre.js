'use strict';

const SOURCE_NAME = 'Mercado Libre Costa Rica';
const ITEM_ID = /^MCR[1-9]\d*$/;

function priceString(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+(?:\.\d{1,4})?$/.test(String(value)) || Number(value) <= 0) {
    throw new Error('Precio de Mercado Libre inválido.');
  }
  return String(value);
}

function normalize(item, sale, equivalent, observedAt, includesTax) {
  const id = String(equivalent.supplier_sku || '').toUpperCase();
  const supplierCode = equivalent.supplierId?.supplier_code;
  if (!ITEM_ID.test(id) || item.id !== id || item.site_id !== 'MCR' || item.status !== 'active' ||
      supplierCode !== `ML-${item.seller_id}` || equivalent.currency_code !== 'CRC' ||
      !(Number(equivalent.pack_quantity) > 0) || item.currency_id !== 'CRC' || sale.currency_id !== 'CRC') {
    throw new Error('Publicación, vendedor, estado o moneda no coinciden con la equivalencia registrada.');
  }
  const url = new URL(item.permalink);
  if (url.protocol !== 'https:' || !/(^|\.)mercadolibre\.co\.cr$/.test(url.hostname)) {
    throw new Error('URL de publicación inválida.');
  }
  return {
    supplier_product_id: equivalent.supplier_product_id,
    observed_at: observedAt,
    unit_price: priceString(sale.amount),
    currency_code: 'CRC',
    price_includes_tax: includesTax,
    source_product_url: url.toString(),
    external_reference: id,
    is_validated: true,
  };
}

async function getJson(path, token, fetcher = fetch) {
  const response = await fetcher(`https://api.mercadolibre.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Mercado Libre respondió HTTP ${response.status}.`);
  return response.json();
}

async function capture(equivalent, token, includesTax, fetcher = fetch, now = new Date()) {
  const id = String(equivalent.supplier_sku || '').toUpperCase();
  if (!ITEM_ID.test(id)) throw new Error('ID de publicación MCR inválido.');
  const item = await getJson(`/items/${id}`, token, fetcher);
  const sale = await getJson(`/items/${id}/sale_price?context=channel_marketplace`, token, fetcher);
  return normalize(item, sale, equivalent, now.toISOString().slice(0, 19) + 'Z', includesTax);
}

async function synchronize(db, { token, includesTax, fetcher = fetch, importer, limit = 100 } = {}) {
  if (!token || /\s/.test(token)) throw new Error('Configura MELI_ACCESS_TOKEN vigente en .env.');
  if (typeof includesTax !== 'boolean') throw new Error('Configura MELI_PRICE_INCLUDES_TAX como true o false tras verificar el tratamiento fiscal.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('MELI_MAX_ITEMS debe estar entre 1 y 100.');
  const source = await db.price_sources.findOne({ where: { source_name: SOURCE_NAME, status: 'active' } });
  if (!source) throw new Error(`Registra la fuente activa «${SOURCE_NAME}» antes de sincronizar.`);
  const { Op } = db.Sequelize;
  const equivalents = await db.supplier_products.findAll({
    where: { status: 'active', supplier_sku: { [Op.regexp]: '^MCR[1-9][0-9]*$' } },
    include: [{ model: db.suppliers, as: 'supplierId', where: { status: 'active' } },
      { model: db.products, as: 'productId', where: { status: 'active' } }],
    order: [['supplier_product_id', 'ASC']], limit: limit + 1,
  });
  if (equivalents.length > limit) throw new Error(`Hay más de ${limit} equivalencias MCR; amplía la sincronización por páginas antes de continuar.`);
  if (!equivalents.length) return { status: 'no_mappings', records_received: 0, records_imported: 0, records_rejected: 0, errors: [] };
  const rows = [], errors = [];
  for (let index = 0; index < equivalents.length; index++) {
    const equivalent = equivalents[index];
    try {
      rows.push(await capture(equivalent, token, includesTax, fetcher));
    } catch (error) {
      errors.push({ row: index + 1, item_id: equivalent.supplier_sku, code: 'SOURCE_ITEM_ERROR', message: error.message });
    }
  }
  const envelope = { version: 1, price_basis: 'per_purchase_unit', availability_basis: 'purchase_units', source_errors: errors };
  if (!rows.length) {
    const batch = await db.price_import_batches.create({ price_source_id: source.price_source_id, status: 'failed',
      completed_at: new Date(), records_received: equivalents.length, records_rejected: errors.length,
      error_summary: JSON.stringify({ ...envelope, errors }) });
    return { import_batch_id: batch.import_batch_id, status: 'failed', records_received: equivalents.length,
      records_imported: 0, records_rejected: errors.length, errors };
  }
  const importService = importer || require('./price-import')(db);
  const result = await importService.import({ price_source_id: source.price_source_id, price_basis: 'per_purchase_unit', rows }, { user_id: null });
  if (errors.length) {
    const batch = await db.price_import_batches.findByPk(result.import_batch_id);
    let summary = {};
    try { summary = JSON.parse(batch.error_summary); } catch { /* preserve a valid envelope below */ }
    await batch.update({ status: result.records_imported ? 'completed_with_errors' : 'failed',
      records_received: equivalents.length, records_rejected: result.records_rejected + errors.length,
      error_summary: JSON.stringify({ ...envelope, ...summary, source_errors: errors, errors: [...errors, ...(summary.errors || [])] }) });
  }
  return { ...result, status: errors.length ? (result.records_imported ? 'completed_with_errors' : 'failed') : result.status,
    records_received: equivalents.length, records_rejected: result.records_rejected + errors.length,
    errors: [...errors, ...result.errors] };
}

module.exports = { SOURCE_NAME, normalize, capture, synchronize };
