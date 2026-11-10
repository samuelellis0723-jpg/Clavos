'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["product_warehouse_policies"], { operations: ["list", "get", "create", "update", "delete"] });
