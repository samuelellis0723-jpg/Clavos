'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/currencies');

module.exports = createResourceRouter(controller, ["currency_code"]);
