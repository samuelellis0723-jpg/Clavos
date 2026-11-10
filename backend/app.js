'use strict';
const express=require('express');
const {errorHandler,ApiError}=require('./lib/errors');
const {authenticate,roles}=require('./middleware/access');
function createApp(db=require('./models'), options={}) {
  const app=express();app.disable('x-powered-by');
  app.use(require('./middleware/cors'));
  app.use(express.json({limit:'256kb'}));
  const access=options.access || require('./services/access')(db);
  app.use('/api/catalog',require('./routes/catalog')(db));
  app.use('/api/auth',require('./routes/access')(access));
  app.get('/health',(req,res)=>res.json({data:{status:'ok'}}));
  // Unknown public URLs return 404; all legacy resources and internal modules require a session.
  const privatePaths=['/api/operations','/api/admin',...Object.keys(require('./controllers')).map(k=>`/api/${k}`)];
  app.use(privatePaths,authenticate(access),(req,res,next)=>{res.set('Cache-Control','no-store');next();});
  app.use('/api/operations',require('./routes/operations')(db));
  app.post('/api/admin/price-imports',roles('admin'),async(req,res)=>res.status(201).json({data:await require('./services/price-import')(db).import(req.body,req.actor)}));
  app.use('/api',require('./routes'));
  app.use((req,res,next)=>next(new ApiError(404,'NOT_FOUND','Ruta no encontrada.')));
  app.use(errorHandler);
  return app;
}
module.exports=createApp();
module.exports.createApp=createApp;
