'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/departments');

module.exports = createResourceRouter(controller, ["department_id"]);
