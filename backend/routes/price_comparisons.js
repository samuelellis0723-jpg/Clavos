'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/price_comparisons');

module.exports = createResourceRouter(controller, ["comparison_id"]);
