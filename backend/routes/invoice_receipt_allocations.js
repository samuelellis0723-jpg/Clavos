'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/invoice_receipt_allocations');

module.exports = createResourceRouter(controller, ["invoice_receipt_allocation_id"]);
