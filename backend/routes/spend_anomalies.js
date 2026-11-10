'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/spend_anomalies');

module.exports = createResourceRouter(controller, ["anomaly_id"]);
