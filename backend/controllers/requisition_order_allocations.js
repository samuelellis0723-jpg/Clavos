'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["requisition_order_allocations"], { operations: ["list", "get", "create", "update"] });
