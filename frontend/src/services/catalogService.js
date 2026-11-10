import { apiRequest, buildQueryString } from './apiClient.js';

/**
 * Public Catalog & Price Comparison Service
 * Strictly connects:
 * - GET /api/catalog/products
 * - GET /api/catalog/categories
 * - GET /api/catalog/products/:product_id
 * - GET /api/catalog/products/:product_id/comparison
 */

export async function fetchCatalogProducts({ q, category_id, unit_id, brand, page = 1, limit = 25 } = {}, options = {}) {
  const qs = buildQueryString({ q, category_id, unit_id, brand, page, limit });
  return apiRequest(`/catalog/products${qs}`, options);
}

export async function fetchCatalogCategories({ page = 1, limit = 100 } = {}, options = {}) {
  const qs = buildQueryString({ page, limit });
  return apiRequest(`/catalog/categories${qs}`, options);
}

export async function fetchCatalogProductDetail(productId, options = {}) {
  return apiRequest(`/catalog/products/${encodeURIComponent(productId)}`, options);
}

export async function fetchCatalogProductComparison(productId, { page = 1, limit = 25 } = {}, options = {}) {
  const qs = buildQueryString({ page, limit });
  return apiRequest(`/catalog/products/${encodeURIComponent(productId)}/comparison${qs}`, options);
}

/**
 * Groups offers strictly by comparison_group so incompatible presentations,
 * currencies, units, or tax treatments are never merged or ranked together.
 * Legacy offers with comparison_group === null (unconfirmed_legacy_basis)
 * are placed in a separate unconfirmed bucket.
 */
export function groupOffersByComparisonGroup(offers = []) {
  const comparableGroupsMap = new Map();
  const unconfirmedOffers = [];

  for (const offer of offers) {
    if (!offer || !offer.comparison_group || offer.price_basis !== 'per_purchase_unit') {
      unconfirmedOffers.push(offer);
      continue;
    }
    const key = offer.comparison_group;
    if (!comparableGroupsMap.has(key)) {
      const [unitIdPart, packQuantityPart, currencyPart, taxPart] = String(key).split('|');
      comparableGroupsMap.set(key, {
        comparison_group: key,
        purchase_unit: offer.purchase_unit || { unit_id: Number(unitIdPart), code: unitIdPart, name: `Unidad ${unitIdPart}` },
        pack_quantity: offer.pack_quantity || packQuantityPart,
        currency_code: offer.currency_code || currencyPart,
        price_includes_tax: taxPart ? taxPart === 'tax_included' : Boolean(offer.price_includes_tax),
        offers: [],
      });
    }
    comparableGroupsMap.get(key).offers.push(offer);
  }

  return {
    comparableGroups: Array.from(comparableGroupsMap.values()),
    unconfirmedOffers,
  };
}
