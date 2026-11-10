'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/stock_lots');

module.exports = createResourceRouter(controller, ["lot_id"]);
