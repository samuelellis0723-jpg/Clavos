'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/product_identifiers');

module.exports = createResourceRouter(controller, ["identifier_id"]);
