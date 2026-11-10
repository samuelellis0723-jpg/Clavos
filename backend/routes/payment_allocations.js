'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/payment_allocations');

module.exports = createResourceRouter(controller, ["payment_allocation_id"]);
