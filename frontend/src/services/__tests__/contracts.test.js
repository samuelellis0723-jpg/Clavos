import test from 'node:test';
import assert from 'node:assert/strict';

import { apiRequest, ApiClientError, setOnUnauthorized, buildQueryString } from '../apiClient.js';
import {
  parseScaledDecimal,
  formatScaledDecimal,
  computeLineAmountsStrings,
  computeDocumentTotalsStrings,
} from '../decimal.js';
import {
  fetchCatalogProducts,
  fetchCatalogProductComparison,
  groupOffersByComparisonGroup,
} from '../catalogService.js';
import { loginWithCredentials, logoutSession } from '../authService.js';
import {
  MASTER_RESOURCES_POLICY,
  updateAdminResourceItem,
  parseImportBatchErrorSummary,
} from '../adminService.js';
import { SYNTHETIC_COMPARISON_PAYLOAD } from '../../mocks/syntheticContractFixtures.js';

function createMockFetch(handler) {
  return async (url, options) => handler(url, options);
}

test('1. buildQueryString omits empty/null values and trims parameters', () => {
  const qs = buildQueryString({ q: ' clavo ', category_id: '', unit_id: null, brand: undefined, page: 2, limit: 25 });
  assert.equal(qs, '?q=clavo&page=2&limit=25');
});

test('2. apiRequest handles 204 No Content without calling response.json()', async () => {
  let jsonCalled = false;
  const mockFetch = createMockFetch(async () => ({
    ok: true,
    status: 204,
    headers: { get: () => null },
    json: async () => {
      jsonCalled = true;
      throw new Error('Should not parse JSON on 204');
    },
  }));

  const result = await logoutSession('a'.repeat(64), { fetchImpl: mockFetch });
  assert.equal(result, null);
  assert.equal(jsonCalled, false);
});

test('3. apiRequest distinguishes network failure from HTTP errors', async () => {
  const mockFetch = createMockFetch(async () => {
    throw new TypeError('fetch failed: ECONNREFUSED');
  });

  await assert.rejects(
    () => fetchCatalogProducts({}, { fetchImpl: mockFetch }),
    (err) => {
      assert.ok(err instanceof ApiClientError);
      assert.equal(err.isNetworkError, true);
      assert.equal(err.status, 0);
      assert.equal(err.code, 'NETWORK_ERROR');
      return true;
    }
  );
});

test('4. apiRequest propagates HTTP error codes (400, 401, 403, 404, 405, 409, 429, 503) and triggers unauthorized callback on 401', async () => {
  let unauthorizedTriggered = 0;
  setOnUnauthorized(() => {
    unauthorizedTriggered += 1;
  });

  const statuses = [
    { status: 400, code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: [{ field: 'sku', rule: 'notEmpty' }] },
    { status: 401, code: 'UNAUTHORIZED', message: 'Sesión inválida o expirada.' },
    { status: 403, code: 'APPROVER_ROLE_REQUIRED', message: 'Se requiere el rol del paso actual; admin no lo reemplaza.' },
    { status: 404, code: 'NOT_FOUND', message: 'Producto no encontrado.' },
    { status: 405, code: 'USE_CASE_REQUIRED', message: 'Escritura genérica deshabilitada.' },
    { status: 409, code: 'APPROVED_BUDGET_EXCEEDED', message: 'El total con impuestos supera el presupuesto aprobado.' },
    { status: 429, code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos de acceso.' },
    { status: 503, code: 'DATABASE_UNAVAILABLE', message: 'La base de datos no está disponible.' },
  ];

  for (const item of statuses) {
    const mockFetch = createMockFetch(async () => ({
      ok: false,
      status: item.status,
      headers: { get: () => 'application/json' },
      json: async () => ({
        error: {
          code: item.code,
          message: item.message,
          ...(item.details ? { details: item.details } : {}),
        },
      }),
    }));

    await assert.rejects(
      () => apiRequest('/operations/requisitions', { fetchImpl: mockFetch }),
      (err) => {
        assert.equal(err.status, item.status);
        assert.equal(err.code, item.code);
        assert.equal(err.message, item.message);
        if (item.details) {
          assert.deepEqual(err.details, item.details);
        }
        return true;
      }
    );
  }

  assert.equal(unauthorizedTriggered, 1);
  setOnUnauthorized(null);
});

test('5. loginWithCredentials sends POST /auth/login and does not trigger redirect on 401 INVALID_CREDENTIALS', async () => {
  let unauthorizedCalled = false;
  setOnUnauthorized(() => {
    unauthorizedCalled = true;
  });

  const mockFetch = createMockFetch(async () => ({
    ok: false,
    status: 401,
    headers: { get: () => 'application/json' },
    json: async () => ({
      error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas o acceso temporalmente bloqueado.' },
    }),
  }));

  await assert.rejects(
    () => loginWithCredentials({ email: 'test@example.test', password: 'wrong' }, { fetchImpl: mockFetch }),
    (err) => {
      assert.equal(err.status, 401);
      assert.equal(err.code, 'INVALID_CREDENTIALS');
      return true;
    }
  );
  assert.equal(unauthorizedCalled, false);
  setOnUnauthorized(null);
});

test('6. groupOffersByComparisonGroup strictly separates incompatible groups and legacy unconfirmed offers', async () => {
  const mockFetch = createMockFetch(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => SYNTHETIC_COMPARISON_PAYLOAD,
  }));

  const response = await fetchCatalogProductComparison(9001, { page: 1, limit: 25 }, { fetchImpl: mockFetch });
  const { comparableGroups, unconfirmedOffers } = groupOffersByComparisonGroup(response.data.offers);

  assert.equal(comparableGroups.length, 2);
  assert.equal(comparableGroups[0].comparison_group, '1|1.000|CRC|tax_included');
  assert.equal(comparableGroups[0].offers.length, 2);
  assert.equal(comparableGroups[1].comparison_group, '2|10.000|USD|tax_excluded');
  assert.equal(comparableGroups[1].offers.length, 1);

  assert.equal(unconfirmedOffers.length, 1);
  assert.equal(unconfirmedOffers[0].price_basis, 'unconfirmed_legacy_basis');
  assert.equal(unconfirmedOffers[0].comparison_group, null);
  assert.equal(unconfirmedOffers[0].is_current_price_guaranteed, false);
});

test('7. Exact BigInt decimal arithmetic mirrors backend/lib/decimal.js without floating-point drift', () => {
  assert.equal(parseScaledDecimal('226.00', 2), 22600n);
  assert.equal(formatScaledDecimal(22600n, 2), '226.00');

  const line = computeLineAmountsStrings('2.000', '100.0000', '0.1300');
  assert.equal(line.valid, true);
  assert.equal(line.subtotal, '200.00');
  assert.equal(line.tax, '26.00');
  assert.equal(line.total, '226.00');

  // Half-up rounding check: 1.500 * 10.0050 = 15.0075 -> 15.01 subtotal
  const fractional = computeLineAmountsStrings('1.500', '10.0050', '0.1300');
  assert.equal(fractional.valid, true);
  assert.equal(fractional.subtotal, '15.01');
  assert.equal(fractional.tax, '1.95');
  assert.equal(fractional.total, '16.96');

  const docTotals = computeDocumentTotalsStrings([
    { quantity_invoiced: '2.000', unit_price: '100.0000', tax_rate: '0.1300' },
    { quantity_invoiced: '1.500', unit_price: '10.0050', tax_rate: '0.1300' },
  ]);
  assert.equal(docTotals.valid, true);
  assert.equal(docTotals.subtotal, '215.01');
  assert.equal(docTotals.tax_total, '27.95');
  assert.equal(docTotals.total_amount, '242.96');
});

test('8. updateAdminResourceItem filters payload strictly to editableFields from crud-policy.js', async () => {
  let capturedBody = null;
  const mockFetch = createMockFetch(async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: { product_id: 1, ...capturedBody } }),
    };
  });

  await updateAdminResourceItem(
    'products',
    1,
    {
      name: 'Nombre Actualizado',
      brand: 'Marca X',
      status: 'active',
      unit_id: 99, // Disallowed by crud-policy.js on PATCH
      category_id: 99, // Disallowed by crud-policy.js on PATCH
    },
    'b'.repeat(64),
    { fetchImpl: mockFetch }
  );

  assert.deepEqual(capturedBody, {
    name: 'Nombre Actualizado',
    brand: 'Marca X',
    status: 'active',
  });
  assert.equal(MASTER_RESOURCES_POLICY.approval_rules.editableFields.length, 0);
  assert.equal(MASTER_RESOURCES_POLICY.users.canCreate, false);
});

test('9. parseImportBatchErrorSummary parses versioned JSON envelope and per-row errors', () => {
  const raw = JSON.stringify({
    version: 1,
    price_basis: 'per_purchase_unit',
    availability_basis: 'purchase_units',
    errors: [{ row: 2, code: 'DUPLICATE_OBSERVATION', message: 'Ya existe una observación de esa fuente, producto y fecha.' }],
  });
  const parsed = parseImportBatchErrorSummary(raw);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.price_basis, 'per_purchase_unit');
  assert.equal(parsed.errors.length, 1);
  assert.equal(parsed.errors[0].row, 2);
  assert.equal(parsed.errors[0].code, 'DUPLICATE_OBSERVATION');
});
