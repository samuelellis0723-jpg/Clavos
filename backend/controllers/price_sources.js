'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["price_sources"], { operations: ["list", "get", "create", "update", "delete"] });
