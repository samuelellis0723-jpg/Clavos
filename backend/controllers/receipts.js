'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["receipts"], { operations: ["list", "get", "create", "update"] });
