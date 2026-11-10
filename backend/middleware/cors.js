'use strict';
const { ApiError } = require('../lib/errors');
module.exports = (req, res, next) => {
  const origin = req.get('Origin');
  if (!origin) return next();
  const allowed = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  if (origin !== allowed) return next(new ApiError(403, 'ORIGIN_DENIED', 'Origen no permitido.'));
  res.set('Access-Control-Allow-Origin', allowed);
  res.vary('Origin');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};
