'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["purchase_orders"], { operations: ["list", "get", "create", "update"] });
