'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/product_warehouse_policies');

module.exports = createResourceRouter(controller, ["product_warehouse_policy_id"]);
