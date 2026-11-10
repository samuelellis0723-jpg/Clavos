'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/spend_analysis_runs');

module.exports = createResourceRouter(controller, ["analysis_run_id"]);
