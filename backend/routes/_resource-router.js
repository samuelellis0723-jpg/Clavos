'use strict';

const { Router } = require('express');
const controllers = require('../controllers');
const policy = require('../middleware/crud-policy');
const { roles } = require('../middleware/access');

function createResourceRouter(controller, primaryKeys) {
  const router = Router();
  const resource = Object.keys(controllers).find(name => controllers[name] === controller);
  router.use(roles('admin'));
  const keyPath = primaryKeys.map(key => `:${key}`).join('/');
  const itemPath = `/${keyPath}`;

  if (controller.list) router.get('/', controller.list);
  if (controller.create) router.post('/', policy(resource, 'create'), controller.create);
  if (controller.get) router.get(itemPath, controller.get);
  if (controller.update) router.patch(itemPath, policy(resource, 'update'), controller.update);
  if (controller.delete) router.delete(itemPath, policy(resource, 'delete'), controller.delete);

  return router;
}

module.exports = createResourceRouter;
