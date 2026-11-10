'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["inventory_movement_lines"], { operations: ["list", "get", "create"] });
