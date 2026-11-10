'use strict';
const db = require('../models');
const { synchronize } = require('../services/mercado-libre');
const { getAccessToken } = require('../services/mercado-libre-token');

async function main() {
  const raw = process.env.MELI_PRICE_INCLUDES_TAX;
  const limit = Number(process.env.MELI_MAX_ITEMS || 100);
  const result = await synchronize(db, {
    token: await getAccessToken(),
    includesTax: raw === 'true' ? true : raw === 'false' ? false : undefined,
    limit,
  });
  console.log(JSON.stringify(result));
  if (result.status === 'failed' || result.status === 'completed_with_errors') process.exitCode = 1;
}

if (require.main === module) main().catch(error => {
  console.error(`Sincronización de Mercado Libre falló: ${error.message}`);
  process.exitCode = 1;
}).finally(() => db.sequelize.close());

module.exports = main;
