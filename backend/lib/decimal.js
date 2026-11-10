'use strict';
const { fail } = require('./errors');
function scaled(value, scale = 2, { positive = false, signed = false, precision = 14 } = {}) {
  if (!['string','number'].includes(typeof value)) fail(400, 'INVALID_DECIMAL', 'Se requiere una cadena decimal o número.');
  const s = String(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) fail(400, 'INVALID_DECIMAL', 'Se requiere un decimal sin notación exponencial.');
  const negative = s.startsWith('-');
  const [whole, fraction = ''] = s.replace(/^-/, '').split('.');
  if (fraction.length > scale || whole.replace(/^0+/, '').length > precision - scale || (negative && !signed)) fail(400, 'INVALID_DECIMAL', 'Precisión, escala o signo inválido.');
  const n = BigInt(whole) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, '0') || '0');
  const result = negative ? -n : n;
  if (positive && result <= 0n) fail(400, 'INVALID_DECIMAL', 'El valor debe ser mayor que cero.');
  return result;
}
function format(n, scale = 2) { const sign = n < 0n ? '-' : ''; const s = (n < 0n ? -n : n).toString().padStart(scale + 1, '0'); return sign + (scale ? s.slice(0, -scale) + '.' + s.slice(-scale) : s); }
function round(n, divisor) { return (n + divisor / 2n) / divisor; }
function amounts(quantity, unitPrice, taxRate) {
  const q = scaled(quantity, 3, { positive: true }), p = scaled(unitPrice, 4), r = scaled(taxRate, 4, { precision: 7 });
  if (r > 10000n) fail(400, 'INVALID_TAX_RATE', 'tax_rate es una fracción entre 0 y 1.');
  const subtotal = round(q * p, 100000n), tax = round(subtotal * r, 10000n);
  // Ensure totals fit the existing DECIMAL(14,2) columns.
  scaled(format(subtotal + tax));
  return { subtotal, tax, total: subtotal + tax };
}
module.exports = { scaled, format, round, amounts };
