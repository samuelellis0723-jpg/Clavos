'use strict';
const { Router } = require('express');
module.exports = db => {
  const router = Router(), service = require('../services/catalog')(db);
  router.get('/products', async (req, res) => res.json(await service.list(req.query)));
  router.get('/products/:product_id/comparison', async (req, res) => res.json(await service.compare(req.params.product_id, req.query)));
  router.get('/products/:product_id', async (req, res) => res.json({ data: await service.get(req.params.product_id) }));
  router.get('/categories', async (req, res) => res.json(await service.categories(req.query)));
  return router;
};
