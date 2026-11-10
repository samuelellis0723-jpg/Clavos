'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["price_comparisons"], { operations: ["list", "get", "create", "update"] });
