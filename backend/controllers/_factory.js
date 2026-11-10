'use strict';

const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

function errorResponse(res, error) {
  if (error.status === 400) {
    return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: error.message } });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
        details: error.errors.map(item => ({ field: item.path, message: item.message })),
      },
    });
  }
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Ya existe un registro con esos valores únicos.' } });
  }
  if (error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({ error: { code: 'REFERENCE_CONFLICT', message: 'La operación contradice una relación existente.' } });
  }
  if (error.name === 'SequelizeDatabaseError' && [1265, 1292, 1366, 1406].includes(error.original && error.original.errno)) {
    return res.status(400).json({ error: { code: 'INVALID_DATA', message: 'Uno o más valores no son compatibles con el esquema.' } });
  }
  if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError' || error.name === 'SequelizeHostNotFoundError') {
    return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'La base de datos no está disponible.' } });
  }
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error al procesar la solicitud.' } });
}

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      errorResponse(res, error);
    }
  };
}

function validatePayload(Model, payload, { partial = false, primaryKeys = [] } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const error = new Error('El cuerpo debe ser un objeto JSON.');
    error.status = 400;
    throw error;
  }
  const allowed = new Set(Object.keys(Model.rawAttributes));
  const unknown = Object.keys(payload).filter(key => !allowed.has(key));
  if (unknown.length) {
    const error = new Error(`Campos desconocidos: ${unknown.join(', ')}.`);
    error.status = 400;
    throw error;
  }
  const immutable = primaryKeys.filter(key => partial || Model.rawAttributes[key].autoIncrement);
  const suppliedImmutable = Object.keys(payload).filter(key => immutable.includes(key));
  if (suppliedImmutable.length) {
    const message = partial
      ? `No se pueden modificar claves primarias: ${suppliedImmutable.join(', ')}.`
      : `No se pueden asignar claves autogeneradas: ${suppliedImmutable.join(', ')}.`;
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
  if (partial && Object.keys(payload).length === 0) {
    const error = new Error('El cuerpo debe incluir al menos un campo para actualizar.');
    error.status = 400;
    throw error;
  }
}

function invalidRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function createController(Model, { operations = ['list', 'get', 'create', 'update', 'delete'] } = {}) {
  const primaryKeys = Object.keys(Model.rawAttributes).filter(name => Model.rawAttributes[name].primaryKey);
  if (!primaryKeys.length) throw new Error(`El modelo ${Model.name} no declara clave primaria.`);

  function getKey(req) {
    const key = {};
    for (const name of primaryKeys) {
      const value = req.params[name];
      if (value === undefined || value === '') invalidRequest(`Falta el parámetro ${name}.`);
      const attribute = Model.rawAttributes[name];
      if (attribute.type && attribute.type.key === 'INTEGER' && !Number.isSafeInteger(Number(value))) {
        invalidRequest(`El parámetro ${name} debe ser un entero.`);
      }
      key[name] = value;
    }
    return key;
  }

  async function findOneOr404(req, res) {
    const record = await Model.findOne({ where: getKey(req) });
    if (!record) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No se encontró el recurso solicitado.' } });
      return null;
    }
    return record;
  }

  const controller = {};
  if (operations.includes('list')) {
    controller.list = wrap(async (req, res) => {
      const query = { ...req.query };
      const limit = query.limit === undefined ? DEFAULT_PAGE_SIZE : Number(query.limit);
      const page = query.page === undefined ? 1 : Number(query.page);
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) invalidRequest(`limit debe ser un entero entre 1 y ${MAX_PAGE_SIZE}.`);
      if (!Number.isSafeInteger(page) || page < 1) invalidRequest('page debe ser un entero mayor que cero.');
      delete query.limit;
      delete query.page;
      const fields = new Set(Object.keys(Model.rawAttributes));
      const unknown = Object.keys(query).filter(key => !fields.has(key));
      if (unknown.length) invalidRequest(`Filtros desconocidos: ${unknown.join(', ')}.`);
      const result = await Model.findAndCountAll({ where: query, limit, offset: (page - 1) * limit });
      res.status(200).json({ data: result.rows, pagination: { total: result.count, page, limit } });
    });
  }
  if (operations.includes('get')) {
    controller.get = wrap(async (req, res) => {
      const record = await findOneOr404(req, res);
      if (record) res.status(200).json({ data: record });
    });
  }
  if (operations.includes('create')) {
    controller.create = wrap(async (req, res) => {
      validatePayload(Model, req.body, { primaryKeys });
      const record = Model.build(req.body);
      await record.validate();
      await record.save();
      res.status(201).json({ data: record });
    });
  }
  if (operations.includes('update')) {
    controller.update = wrap(async (req, res) => {
      const record = await findOneOr404(req, res);
      if (!record) return;
      validatePayload(Model, req.body, { partial: true, primaryKeys });
      record.set(req.body);
      await record.validate();
      await record.save({ fields: Object.keys(req.body) });
      res.status(200).json({ data: record });
    });
  }
  if (operations.includes('delete')) {
    controller.delete = wrap(async (req, res) => {
      const record = await findOneOr404(req, res);
      if (!record) return;
      await record.destroy();
      res.status(204).end();
    });
  }
  return controller;
}

module.exports = { createController, errorResponse };
