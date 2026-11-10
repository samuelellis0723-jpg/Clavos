'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["supplier_invoices"], { operations: ["list", "get", "create", "update"] });
