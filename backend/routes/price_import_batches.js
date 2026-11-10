'use strict';

const createResourceRouter = require('./_resource-router');
const controller = require('../controllers/price_import_batches');

module.exports = createResourceRouter(controller, ["import_batch_id"]);
