'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["price_comparison_items"], { operations: ["list", "get", "create", "update"] });
