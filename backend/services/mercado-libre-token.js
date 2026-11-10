'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const DEFAULT_FILE = path.join(__dirname, '..', '.mercado-libre-token.json');

async function readToken(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function getAccessToken({ env = process.env, file = DEFAULT_FILE, fetcher = fetch, now = Date.now() } = {}) {
  if (env.MELI_ACCESS_TOKEN) return env.MELI_ACCESS_TOKEN;
  const saved = await readToken(file);
  if (saved?.access_token && saved.expires_at > now + 60000) return saved.access_token;
  const refresh = saved?.refresh_token || env.MELI_REFRESH_TOKEN;
  if (!env.MELI_CLIENT_ID || !env.MELI_CLIENT_SECRET || !refresh) {
    throw new Error('Configura MELI_ACCESS_TOKEN o MELI_CLIENT_ID, MELI_CLIENT_SECRET y MELI_REFRESH_TOKEN.');
  }
  const response = await fetcher('https://api.mercadolibre.com/oauth/token', {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: env.MELI_CLIENT_ID,
      client_secret: env.MELI_CLIENT_SECRET, refresh_token: refresh }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Mercado Libre rechazó la renovación del token (HTTP ${response.status}).`);
  const data = await response.json();
  if (!data.access_token || !data.refresh_token || !Number.isFinite(Number(data.expires_in))) {
    throw new Error('Respuesta OAuth incompleta.');
  }
  const next = { access_token: data.access_token, refresh_token: data.refresh_token,
    expires_at: now + Number(data.expires_in) * 1000 };
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(next), { mode: 0o600, flag: 'wx' });
    await fs.rename(temporary, file);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw new Error(`No se pudo guardar el nuevo refresh token: ${error.message}`);
  }
  return next.access_token;
}

module.exports = { getAccessToken };
