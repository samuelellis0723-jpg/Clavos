'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/purchase_orders');

module.exports = createResourceRouter(controller, ["purchase_order_id"]);
