'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/payments');

module.exports = createResourceRouter(controller, ["payment_id"]);
