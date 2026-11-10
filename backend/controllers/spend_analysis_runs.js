'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["spend_analysis_runs"], { operations: ["list", "get", "create", "update"] });
