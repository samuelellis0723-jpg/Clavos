'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["payment_allocations"], { operations: ["list", "get", "create", "update"] });
