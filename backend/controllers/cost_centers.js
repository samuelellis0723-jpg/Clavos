'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["cost_centers"], { operations: ["list", "get", "create", "update", "delete"] });
