'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/purchase_order_lines');

module.exports = createResourceRouter(controller, ["purchase_order_line_id"]);
