'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/invoice_lines');

module.exports = createResourceRouter(controller, ["invoice_line_id"]);
