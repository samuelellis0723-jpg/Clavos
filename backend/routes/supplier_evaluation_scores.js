'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/supplier_evaluation_scores');

module.exports = createResourceRouter(controller, ["evaluation_score_id"]);
