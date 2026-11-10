'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("suppliers", {
    "supplier_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_code": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "legal_name": { type: DataTypes.STRING(180), allowNull: false },
    "trade_name": { type: DataTypes.STRING(180) },
    "tax_id": { type: DataTypes.STRING(50) },
    "email": { type: DataTypes.STRING(180) },
    "phone": { type: DataTypes.STRING(40) },
    "website": { type: DataTypes.STRING(255) },
    "address": { type: DataTypes.TEXT },
    "default_currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "payment_terms_days": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "suppliers", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["currencies"], { foreignKey: "default_currency_code", targetKey: "currency_code", as: "defaultCurrencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "default_currency_code", sourceKey: "currency_code", as: "suppliersByDefaultCurrencyCode" });
  };
  return Model;
};
