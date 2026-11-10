'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/requisition_approvals');

module.exports = createResourceRouter(controller, ["requisition_approval_id"]);
