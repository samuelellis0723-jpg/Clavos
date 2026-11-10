'use strict';
class ApiError extends Error {
  constructor(status, code, message, details) { super(message); Object.assign(this, { status, code, details }); }
}
const fail = (status, code, message, details) => { throw new ApiError(status, code, message, details); };
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = 500, code = 'INTERNAL_ERROR', message = 'No se pudo procesar la solicitud.', details;
  if (error instanceof ApiError) ({ status, code, message, details } = error);
  else if (error.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'El cuerpo JSON no es válido.'; }
  else if (error.type === 'entity.too.large') { status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'El cuerpo supera el límite permitido.'; }
  // UniqueConstraintError extends ValidationError: order matters.
  else if (error.name === 'SequelizeUniqueConstraintError') { status = 409; code = 'CONFLICT'; message = 'Ya existe un registro con esos valores únicos.'; }
  else if (error.name === 'SequelizeForeignKeyConstraintError') { status = 409; code = 'REFERENCE_CONFLICT'; message = 'La operación contradice una relación existente.'; }
  else if (error.name === 'SequelizeValidationError') { status = 400; code = 'VALIDATION_ERROR'; message = 'Los datos no cumplen el esquema.'; details = error.errors.map(x => ({ field: x.path, rule: x.validatorKey || 'invalid' })); }
  else if (error.status === 400) { status = 400; code = 'INVALID_REQUEST'; message = error.message; }
  else if (/^Sequelize(Connection|Host|AccessDenied|Timeout)/.test(error.name || '')) { status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'La base de datos no está disponible.'; }
  else if ([1265, 1292, 1366, 1406, 1264].includes(error.original?.errno)) { status = 400; code = 'INVALID_DATA'; message = 'Los valores no son compatibles con el esquema.'; }
  else if ([1213, 1205].includes(error.original?.errno)) { status = 409; code = 'RETRY_TRANSACTION'; message = 'Conflicto concurrente; vuelve a intentar la operación.'; }
  // Never log request bodies, credentials, SQL or driver error messages.
  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(JSON.stringify({ code, errorType: error.name || 'Error' }));
  return res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}
module.exports = { ApiError, fail, errorHandler };
