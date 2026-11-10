'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["evaluation_criteria"], { operations: ["list", "get", "create", "update", "delete"] });
