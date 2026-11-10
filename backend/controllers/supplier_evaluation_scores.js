'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["supplier_evaluation_scores"], { operations: ["list", "get", "create", "update"] });
