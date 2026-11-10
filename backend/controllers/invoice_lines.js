'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["invoice_lines"], { operations: ["list", "get", "create", "update"] });
