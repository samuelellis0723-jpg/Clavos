'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/supplier_products');

module.exports = createResourceRouter(controller, ["supplier_product_id"]);
