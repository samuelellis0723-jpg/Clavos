'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/contracts');

module.exports = createResourceRouter(controller, ["contract_id"]);
