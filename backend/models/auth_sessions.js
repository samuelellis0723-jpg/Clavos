'use strict';
module.exports = (sequelize, D) => sequelize.define('auth_sessions', {
  token_hash: { type: D.CHAR(64), primaryKey: true, allowNull: false },
  user_id: { type: D.INTEGER, allowNull: false },
  created_at: { type: D.DATE, allowNull: false },
  expires_at: { type: D.DATE, allowNull: false },
  revoked_at: { type: D.DATE },
}, { tableName: 'auth_sessions', timestamps: false });
