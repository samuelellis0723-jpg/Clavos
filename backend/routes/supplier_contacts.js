'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/supplier_contacts');

module.exports = createResourceRouter(controller, ["contact_id"]);
