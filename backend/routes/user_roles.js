'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/user_roles');

module.exports = createResourceRouter(controller, ["user_id","role_id"]);
