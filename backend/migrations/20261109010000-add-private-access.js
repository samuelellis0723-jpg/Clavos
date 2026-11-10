'use strict';
const { DataTypes } = require('sequelize');
module.exports = {
  async up(q) {
    // Additive migration. Existing users and business tables are untouched.
    for (const table of ['auth_credentials','auth_sessions']) {
      if (await q.tableExists(table)) throw new Error(`Review existing ${table} before applying this migration.`);
    }
    await q.createTable('auth_credentials', {
      user_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      failed_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      locked_until: { type: DataTypes.DATE, allowNull: true },
    });
    await q.createTable('auth_sessions', {
      token_hash: { type: DataTypes.CHAR(64), primaryKey: true, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' },
      created_at: { type: DataTypes.DATE, allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
    });
  },
  async down() { throw new Error('Automatic removal of access history is disabled. Use a reviewed forward migration.'); },
};
