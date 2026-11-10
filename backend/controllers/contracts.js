'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["contracts"], { operations: ["list", "get", "create", "update", "delete"] });
