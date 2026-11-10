'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["requisition_lines"], { operations: ["list", "get", "create", "update"] });
