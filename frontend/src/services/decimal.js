/**
 * Exact scaled integer arithmetic (BigInt) mirroring backend/lib/decimal.js.
 * Prevents converting monetary decimals to IEEE-754 Number for invoice/order/requisition math.
 */

export function parseScaledDecimal(value, scale = 2, { positive = false, signed = false, precision = 14 } = {}) {
  if (value === null || value === undefined) {
    throw new Error('Valor decimal requerido.');
  }
  const s = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) {
    throw new Error('Formato decimal inválido (usa dígitos y punto decimal, sin notación exponencial).');
  }
  const negative = s.startsWith('-');
  const [whole, fraction = ''] = s.replace(/^-/, '').split('.');
  const cleanWhole = whole.replace(/^0+/, '');
  if (fraction.length > scale || cleanWhole.length > precision - scale || (negative && !signed)) {
    throw new Error(`El valor excede la escala (${scale} decimales) o precisión permitida.`);
  }
  const factor = 10n ** BigInt(scale);
  const paddedFraction = fraction.padEnd(scale, '0') || '0';
  const raw = BigInt(whole) * factor + BigInt(paddedFraction);
  const result = negative ? -raw : raw;
  if (positive && result <= 0n) {
    throw new Error('El valor debe ser mayor que cero.');
  }
  return result;
}

export function formatScaledDecimal(bigintValue, scale = 2) {
  const n = BigInt(bigintValue);
  const sign = n < 0n ? '-' : '';
  const abs = (n < 0n ? -n : n).toString().padStart(scale + 1, '0');
  if (scale === 0) return sign + abs;
  return `${sign}${abs.slice(0, -scale)}.${abs.slice(-scale)}`;
}

export function roundHalfUp(numerator, divisor) {
  return (numerator + divisor / 2n) / divisor;
}

/**
 * Mirrors backend amounts(quantity, unitPrice, taxRate):
 * - quantity: scale 3 (up to 3 decimals)
 * - unitPrice: scale 4 (up to 4 decimals)
 * - taxRate: scale 4 fraction between 0 and 1 (e.g. "0.1300" for 13%)
 * Returns exact decimal strings { subtotal, tax, total }.
 */
export function computeLineAmountsStrings(quantityStr, unitPriceStr, taxRateStr = '0.0000') {
  try {
    const q = parseScaledDecimal(quantityStr, 3, { positive: true });
    const p = parseScaledDecimal(unitPriceStr, 4, { positive: false });
    const r = parseScaledDecimal(taxRateStr, 4, { precision: 7 });
    if (r < 0n || r > 10000n) {
      return { valid: false, error: 'La tasa de impuesto (tax_rate) debe ser una fracción entre 0.0000 y 1.0000 (ej. 0.1300).' };
    }
    const subtotalScaled = roundHalfUp(q * p, 100000n);
    const taxScaled = roundHalfUp(subtotalScaled * r, 10000n);
    const totalScaled = subtotalScaled + taxScaled;
    return {
      valid: true,
      subtotalScaled,
      taxScaled,
      totalScaled,
      subtotal: formatScaledDecimal(subtotalScaled, 2),
      tax: formatScaledDecimal(taxScaled, 2),
      total: formatScaledDecimal(totalScaled, 2),
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Computes exact totals across an array of lines ({ quantity, unit_price, tax_rate })
 * using scaled BigInt arithmetic. Never uses Number() for money summation.
 */
export function computeDocumentTotalsStrings(lines = []) {
  let subtotalSum = 0n;
  let taxSum = 0n;
  for (const line of lines) {
    const res = computeLineAmountsStrings(
      line.quantity ?? line.quantity_requested ?? line.quantity_ordered ?? line.quantity_invoiced,
      line.unit_price ?? line.estimated_unit_price,
      line.tax_rate ?? '0.0000'
    );
    if (!res.valid) {
      return { valid: false, error: res.error };
    }
    subtotalSum += res.subtotalScaled;
    taxSum += res.taxScaled;
  }
  const totalSum = subtotalSum + taxSum;
  return {
    valid: true,
    subtotal: formatScaledDecimal(subtotalSum, 2),
    tax_total: formatScaledDecimal(taxSum, 2),
    total_amount: formatScaledDecimal(totalSum, 2),
  };
}
