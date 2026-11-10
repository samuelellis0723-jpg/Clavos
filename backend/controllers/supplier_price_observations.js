'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["supplier_price_observations"], { operations: ["list", "get", "create"] });
