'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/supplier_evaluations');

module.exports = createResourceRouter(controller, ["evaluation_id"]);
