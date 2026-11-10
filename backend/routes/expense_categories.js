'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/expense_categories');

module.exports = createResourceRouter(controller, ["category_id"]);
