'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/contract_lines');

module.exports = createResourceRouter(controller, ["contract_line_id"]);
