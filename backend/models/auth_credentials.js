'use strict';
module.exports = (sequelize, D) => sequelize.define('auth_credentials', {
  user_id: { type: D.INTEGER, primaryKey: true, allowNull: false },
  password_hash: { type: D.STRING(255), allowNull: false },
  failed_attempts: { type: D.INTEGER, allowNull: false, defaultValue: 0 },
  locked_until: { type: D.DATE },
}, { tableName: 'auth_credentials', timestamps: false });
