'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/inventory_movement_lines');

module.exports = createResourceRouter(controller, ["inventory_movement_line_id"]);
