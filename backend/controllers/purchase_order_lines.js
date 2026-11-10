'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["purchase_order_lines"], { operations: ["list", "get", "create", "update"] });
