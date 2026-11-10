'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["price_import_batches"], { operations: ["list", "get", "create", "update"] });
