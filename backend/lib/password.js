'use strict';
const { randomBytes, scrypt, timingSafeEqual, createHash } = require('crypto');
const { promisify } = require('util');
const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, options);
  return `scrypt$131072$8$1$${salt}$${hash.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const match = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(stored || '');
  const expected = match ? Buffer.from(match[2], 'hex') : Buffer.alloc(64);
  const actual = await derive(password, match ? match[1] : '00000000000000000000000000000000', 64, options);
  return timingSafeEqual(actual, expected) && !!match;
}
const tokenHash = value => createHash('sha256').update(value).digest('hex');
module.exports = { hashPassword, verifyPassword, tokenHash };
