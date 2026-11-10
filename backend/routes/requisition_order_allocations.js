'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/requisition_order_allocations');

module.exports = createResourceRouter(controller, ["allocation_id"]);
