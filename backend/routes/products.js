'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/products');

module.exports = createResourceRouter(controller, ["product_id"]);
