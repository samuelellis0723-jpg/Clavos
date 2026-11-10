'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["approval_rules"], { operations: ["list", "get", "create", "update", "delete"] });
