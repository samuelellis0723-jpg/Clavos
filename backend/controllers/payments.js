'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["payments"], { operations: ["list", "get", "create", "update"] });
