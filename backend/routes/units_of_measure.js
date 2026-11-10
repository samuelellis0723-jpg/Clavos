'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/units_of_measure');

module.exports = createResourceRouter(controller, ["unit_id"]);
