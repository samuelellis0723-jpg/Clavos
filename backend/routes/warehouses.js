'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/warehouses');

module.exports = createResourceRouter(controller, ["warehouse_id"]);
