'use strict';
const { fail } = require('./errors');
function object(value, keys, required = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'INVALID_REQUEST', 'Se requiere un objeto JSON.');
  if (Object.keys(value).some(k => !keys.includes(k))) fail(400, 'UNKNOWN_FIELDS', 'Hay campos no permitidos.');
  for (const k of required) if (value[k] === undefined || value[k] === null) fail(400, 'MISSING_FIELD', `Falta ${k}.`);
  return value;
}
function id(v, field = 'id') {
  if (!['string','number'].includes(typeof v) || !/^[1-9]\d*$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) > 2147483647) fail(400, 'INVALID_ID', `${field} debe ser un entero positivo.`);
  return Number(v);
}
function text(v, field, max = 255) { if (typeof v !== 'string' || !v.trim() || [...v].length > max) fail(400, 'INVALID_FIELD', `${field} no es válido.`); return v.trim(); }
function date(v, field = 'date') {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10) !== v) fail(400, 'INVALID_DATE', `${field} requiere YYYY-MM-DD.`);
  return v;
}
function instant(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.000)?Z$/.test(v) || !Number.isFinite(Date.parse(v))) fail(400, 'INVALID_DATE', 'observed_at requiere UTC ISO 8601 con precisión de segundos.');
  if (new Date(v).toISOString() !== v.replace(/Z$/, v.includes('.') ? 'Z' : '.000Z')) fail(400, 'INVALID_DATE', 'Fecha inválida.');
  if (Date.parse(v) > Date.now()) fail(400, 'FUTURE_OBSERVATION', 'La observación no puede estar en el futuro.');
  return new Date(v);
}
function lines(v, max = 100) { if (!Array.isArray(v) || !v.length || v.length > max) fail(400, 'INVALID_LINES', `Se requieren entre 1 y ${max} filas.`); return v; }
function page(query, allowed = []) {
  object(query, ['page','limit', ...allowed]);
  const n = id(query.page ?? 1, 'page'), limit = id(query.limit ?? 25, 'limit');
  if (limit > 100 || (n - 1) * limit > 2147483647) fail(400, 'INVALID_PAGINATION', 'limit máximo 100; página fuera de rango.');
  return { page: n, limit, offset: (n - 1) * limit };
}
module.exports = { object, id, text, date, instant, lines, page };
