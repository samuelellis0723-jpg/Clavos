'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/supplier_invoices');

module.exports = createResourceRouter(controller, ["invoice_id"]);
