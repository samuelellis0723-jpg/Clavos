'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("payments", {
    "payment_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "payment_reference": { type: DataTypes.STRING(100), unique: true },
    "payment_date": { type: DataTypes.DATEONLY },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "amount": { type: DataTypes.DECIMAL(14,2), allowNull: false },
    "payment_method": { type: DataTypes.STRING(40) },
    "status": { type: DataTypes.ENUM("scheduled", "processing", "completed", "failed", "cancelled"), allowNull: false, defaultValue: "scheduled" },
    "created_by_user_id": { type: DataTypes.INTEGER },
    "confirmed_by_user_id": { type: DataTypes.INTEGER },
    "bank_reference": { type: DataTypes.STRING(120) },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "payments", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "paymentsByCurrencyCode" });
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "paymentsByCreatedByUserId" });
    Model.belongsTo(models["users"], { foreignKey: "confirmed_by_user_id", targetKey: "user_id", as: "confirmedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "confirmed_by_user_id", sourceKey: "user_id", as: "paymentsByConfirmedByUserId" });
  };
  return Model;
};
