'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { capture, normalize, synchronize } = require('../services/mercado-libre');
const { getAccessToken } = require('../services/mercado-libre-token');

const equivalent = { supplier_product_id: 12, supplier_sku: 'MCR12345', currency_code: 'CRC', pack_quantity: '1.000', supplierId: { supplier_code: 'ML-91' } };
const item = { id: 'MCR12345', site_id: 'MCR', seller_id: 91, status: 'active',
  currency_id: 'CRC', permalink: 'https://articulo.mercadolibre.co.cr/MCR-12345' };
const sale = { amount: 1500.25, currency_id: 'CRC' };

test('captures the official sale price only for an explicitly mapped seller and listing', async () => {
  const urls = [];
  const fetcher = async (url, options) => {
    urls.push(url);
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return { ok: true, json: async () => url.includes('/sale_price?') ? sale : item };
  };
  const row = await capture(equivalent, 'test-token', true, fetcher, new Date('2026-11-10T12:00:00Z'));
  assert.deepEqual(urls, [
    'https://api.mercadolibre.com/items/MCR12345',
    'https://api.mercadolibre.com/items/MCR12345/sale_price?context=channel_marketplace',
  ]);
  assert.equal(row.unit_price, '1500.25');
  assert.equal(row.observed_at, '2026-11-10T12:00:00Z');
  assert.equal(row.external_reference, 'MCR12345');
  assert.equal(row.is_validated, true);
});

test('rejects a seller mismatch, a non-CRC price or an unsafe URL', () => {
  assert.throws(() => normalize({ ...item, seller_id: 92 }, sale, equivalent, '2026-11-10T12:00:00Z', true));
  assert.throws(() => normalize(item, { ...sale, currency_id: 'USD' }, equivalent, '2026-11-10T12:00:00Z', true));
  assert.throws(() => normalize({ ...item, permalink: 'https://example.org/' }, sale, equivalent, '2026-11-10T12:00:00Z', true));
});

test('refreshes and persists both rotating OAuth tokens without printing them', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clavos-meli-'));
  const file = path.join(dir, 'tokens.json');
  let calls = 0;
  try {
    const env = { MELI_CLIENT_ID: 'app', MELI_CLIENT_SECRET: 'secret', MELI_REFRESH_TOKEN: 'first-refresh' };
    const fetcher = async (url, options) => {
      calls++;
      assert.equal(url, 'https://api.mercadolibre.com/oauth/token');
      assert.equal(new URLSearchParams(options.body).get('refresh_token'), 'first-refresh');
      return { ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'next-refresh', expires_in: 3600 }) };
    };
    assert.equal(await getAccessToken({ env, file, fetcher, now: 1000 }), 'new-access');
    assert.equal(await getAccessToken({ env, file, fetcher, now: 2000 }), 'new-access');
    assert.equal(calls, 1);
    assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).refresh_token, 'next-refresh');
    assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('records a failed listing and continues importing the other listing', async () => {
  let saved, submitted;
  const batch = { error_summary: JSON.stringify({ version: 1, price_basis: 'per_purchase_unit', errors: [] }),
    async update(data) { saved = data; } };
  const db = { Sequelize: { Op: { regexp: Symbol('regexp') } },
    price_sources: { findOne: async () => ({ price_source_id: 7 }) },
    suppliers: {}, products: {},
    supplier_products: { findAll: async () => [equivalent, { ...equivalent, supplier_product_id: 13, supplier_sku: 'MCR99999' }] },
    price_import_batches: { findByPk: async () => batch },
  };
  const fetcher = async url => url.includes('MCR99999') ? { ok: false, status: 404 } :
    { ok: true, json: async () => url.includes('/sale_price?') ? sale : item };
  const importer = { async import(body, actor) {
    submitted = { body, actor };
    return { import_batch_id: 3, status: 'completed', records_received: 1, records_imported: 1, records_rejected: 0, errors: [] };
  } };
  const result = await synchronize(db, { token: 'test-token', includesTax: true, fetcher, importer });
  assert.equal(submitted.body.rows.length, 1);
  assert.equal(submitted.actor.user_id, null);
  assert.equal(result.status, 'completed_with_errors');
  assert.equal(result.records_rejected, 1);
  assert.equal(saved.records_received, 2);
  assert.equal(JSON.parse(saved.error_summary).errors[0].item_id, 'MCR99999');
});
