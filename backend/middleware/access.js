'use strict';
const { ApiError } = require('../lib/errors');
const { permit } = require('../services/workflow');
const loginAttempts = new Map();
function loginLimit(req,res,next) {
  const now=Date.now(), key=req.ip;
  for(const [ip,entry] of loginAttempts)if(entry.until<=now)loginAttempts.delete(ip);
  const entry=loginAttempts.get(key)||{count:0,until:now+60000};
  if(loginAttempts.size>=5000&&!loginAttempts.has(key))return next(new ApiError(429,'TOO_MANY_REQUESTS','Vuelve a intentar más tarde.'));
  entry.count++;loginAttempts.set(key,entry);
  if(entry.count>10){res.set('Retry-After','60');return next(new ApiError(429,'TOO_MANY_REQUESTS','Demasiados intentos de acceso.'));}
  next();
}
const authenticate = service => async (req,res,next) => { req.actor=await service.authenticate(req.get('Authorization'));next(); };
const roles = (...allowed) => (req,res,next) => { permit(req.actor,allowed);next(); };
module.exports={authenticate,roles,loginLimit};
