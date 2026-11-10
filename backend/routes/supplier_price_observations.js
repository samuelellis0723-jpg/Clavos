'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/supplier_price_observations');

module.exports = createResourceRouter(controller, ["price_observation_id"]);
