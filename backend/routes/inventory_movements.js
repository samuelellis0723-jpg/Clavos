'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/inventory_movements');

module.exports = createResourceRouter(controller, ["inventory_movement_id"]);
