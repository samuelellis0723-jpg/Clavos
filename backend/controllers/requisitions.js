'use strict';

const db = require('../models');
const { createController } = require('./_factory');

module.exports = createController(db["requisitions"], { operations: ["list", "get", "create", "update"] });
