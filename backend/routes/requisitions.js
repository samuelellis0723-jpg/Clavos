'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/requisitions');

module.exports = createResourceRouter(controller, ["requisition_id"]);
