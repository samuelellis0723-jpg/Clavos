'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/price_comparison_items');

module.exports = createResourceRouter(controller, ["comparison_item_id"]);
