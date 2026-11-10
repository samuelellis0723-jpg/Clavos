'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["expense_categories"], { operations: ["list", "get", "create", "update", "delete"] });
