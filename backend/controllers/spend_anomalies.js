'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["spend_anomalies"], { operations: ["list", "get", "create", "update"] });
