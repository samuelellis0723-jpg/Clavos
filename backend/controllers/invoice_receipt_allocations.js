'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["invoice_receipt_allocations"], { operations: ["list", "get", "create", "update"] });
