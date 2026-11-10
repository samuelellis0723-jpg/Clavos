'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/cost_centers');

module.exports = createResourceRouter(controller, ["cost_center_id"]);
