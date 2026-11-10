'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/roles');

module.exports = createResourceRouter(controller, ["role_id"]);
