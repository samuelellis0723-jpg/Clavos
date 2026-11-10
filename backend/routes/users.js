'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/users');

module.exports = createResourceRouter(controller, ["user_id"]);
