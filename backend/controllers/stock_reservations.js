'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["stock_reservations"], { operations: ["list", "get", "create", "update"] });
