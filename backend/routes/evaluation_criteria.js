'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/evaluation_criteria');

module.exports = createResourceRouter(controller, ["criterion_id"]);
