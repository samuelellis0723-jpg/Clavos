'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/stock_reservations');

module.exports = createResourceRouter(controller, ["reservation_id"]);
