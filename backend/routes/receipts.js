'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/receipts');

module.exports = createResourceRouter(controller, ["receipt_id"]);
