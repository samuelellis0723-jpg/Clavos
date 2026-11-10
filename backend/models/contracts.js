'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("contracts", {
    "contract_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "contract_number": { type: DataTypes.STRING(80), allowNull: false, unique: true },
    "title": { type: DataTypes.STRING(180), allowNull: false },
    "start_date": { type: DataTypes.DATEONLY, allowNull: false },
    "end_date": { type: DataTypes.DATEONLY },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "status": { type: DataTypes.STRING(30), allowNull: false },
    "document_url": { type: DataTypes.STRING(500) },
    "created_by_user_id": { type: DataTypes.INTEGER },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "contracts", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "contractsBySupplierId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "contractsByCurrencyCode" });
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "contractsByCreatedByUserId" });
  };
  return Model;
};
