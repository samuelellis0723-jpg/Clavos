'use strict';

const { errorHandler } = require('../lib/errors');
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

function errorResponse(res, error) { return errorHandler(error, null, res, () => {}); }

function wrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
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
      if (attribute.type && attribute.type.key === 'INTEGER' && (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647)) {
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
      if (Object.values(query).some(value => typeof value !== 'string') || !Number.isSafeInteger((page - 1) * limit) || (page - 1) * limit > 2147483647) invalidRequest('Filtros o paginación no válidos.');
      const result = await Model.findAndCountAll({ where: query, limit, offset: (page - 1) * limit, order: primaryKeys.map(key => [key, 'ASC']) });
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
