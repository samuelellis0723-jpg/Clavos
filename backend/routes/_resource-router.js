'use strict';

const { Router } = require('express');

function createResourceRouter(controller, primaryKeys) {
  const router = Router();
  const keyPath = primaryKeys.map(key => `:${key}`).join('/');
  const itemPath = `/${keyPath}`;

  if (controller.list) router.get('/', controller.list);
  if (controller.create) router.post('/', controller.create);
  if (controller.get) router.get(itemPath, controller.get);
  if (controller.update) router.patch(itemPath, controller.update);
  if (controller.delete) router.delete(itemPath, controller.delete);

  return router;
}

module.exports = createResourceRouter;
