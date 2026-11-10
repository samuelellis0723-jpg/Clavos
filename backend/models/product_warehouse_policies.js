'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("product_warehouse_policies", {
    "product_warehouse_policy_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "warehouse_id": { type: DataTypes.INTEGER, allowNull: false },
    "minimum_stock": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
    "safety_stock": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
    "reorder_point": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
    "target_stock": { type: DataTypes.DECIMAL(14,3) },
    "average_daily_demand": { type: DataTypes.DECIMAL(14,4) },
    "lead_time_days": { type: DataTypes.INTEGER },
    "review_period_days": { type: DataTypes.INTEGER },
    "last_calculated_at": { type: DataTypes.DATE },
    "calculation_method": { type: DataTypes.STRING(80) },
  }, { tableName: "product_warehouse_policies", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "productWarehousePoliciesByProductId" });
    Model.belongsTo(models["warehouses"], { foreignKey: "warehouse_id", targetKey: "warehouse_id", as: "warehouseId" });
    models["warehouses"].hasMany(Model, { foreignKey: "warehouse_id", sourceKey: "warehouse_id", as: "productWarehousePoliciesByWarehouseId" });
  };
  return Model;
};
