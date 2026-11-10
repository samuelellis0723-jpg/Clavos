'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/approval_rules');

module.exports = createResourceRouter(controller, ["approval_rule_id"]);
