'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/suppliers');

module.exports = createResourceRouter(controller, ["supplier_id"]);
