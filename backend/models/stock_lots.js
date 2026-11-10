'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("stock_lots", {
    "lot_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "warehouse_id": { type: DataTypes.INTEGER, allowNull: false },
    "lot_number": { type: DataTypes.STRING(100), allowNull: false },
    "received_at": { type: DataTypes.DATE },
    "expiration_date": { type: DataTypes.DATEONLY },
    "unit_cost": { type: DataTypes.DECIMAL(14,4) },
    "currency_code": { type: DataTypes.CHAR(3) },
    "status": { type: DataTypes.STRING(30), allowNull: false, defaultValue: "available" },
  }, { tableName: "stock_lots", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "stockLotsByProductId" });
    Model.belongsTo(models["warehouses"], { foreignKey: "warehouse_id", targetKey: "warehouse_id", as: "warehouseId" });
    models["warehouses"].hasMany(Model, { foreignKey: "warehouse_id", sourceKey: "warehouse_id", as: "stockLotsByWarehouseId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "stockLotsByCurrencyCode" });
  };
  return Model;
};
