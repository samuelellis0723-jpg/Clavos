'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/receipt_lines');

module.exports = createResourceRouter(controller, ["receipt_line_id"]);
