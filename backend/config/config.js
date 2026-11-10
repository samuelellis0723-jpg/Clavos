'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const configuration = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00',
  pool: { max: 10, min: 0, acquire: 10000 },
};
module.exports = { development: { ...configuration }, test: { ...configuration }, production: { ...configuration } };
