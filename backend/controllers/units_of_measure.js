'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["units_of_measure"], { operations: ["list", "get", "create", "update", "delete"] });
