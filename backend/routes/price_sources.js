'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/price_sources');

module.exports = createResourceRouter(controller, ["price_source_id"]);
