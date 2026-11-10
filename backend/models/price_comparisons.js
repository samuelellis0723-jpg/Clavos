'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("price_comparisons", {
    "comparison_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "comparison_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "requisition_id": { type: DataTypes.INTEGER },
    "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "status": { type: DataTypes.ENUM("draft", "completed", "cancelled"), allowNull: false, defaultValue: "draft" },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "price_comparisons", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["requisitions"], { foreignKey: "requisition_id", targetKey: "requisition_id", as: "requisitionId" });
    models["requisitions"].hasMany(Model, { foreignKey: "requisition_id", sourceKey: "requisition_id", as: "priceComparisonsByRequisitionId" });
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "priceComparisonsByCreatedByUserId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "priceComparisonsByCurrencyCode" });
  };
  return Model;
};
