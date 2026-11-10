'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/requisition_lines');

module.exports = createResourceRouter(controller, ["requisition_line_id"]);
