'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("inventory_movement_lines", {
    "inventory_movement_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "inventory_movement_id": { type: DataTypes.INTEGER, allowNull: false },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "warehouse_id": { type: DataTypes.INTEGER, allowNull: false },
    "lot_id": { type: DataTypes.INTEGER },
    "quantity_change": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "unit_cost": { type: DataTypes.DECIMAL(14,4) },
    "currency_code": { type: DataTypes.CHAR(3) },
    "receipt_line_id": { type: DataTypes.INTEGER },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "inventory_movement_lines", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["inventory_movements"], { foreignKey: "inventory_movement_id", targetKey: "inventory_movement_id", as: "inventoryMovementId" });
    models["inventory_movements"].hasMany(Model, { foreignKey: "inventory_movement_id", sourceKey: "inventory_movement_id", as: "inventoryMovementLinesByInventoryMovementId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "inventoryMovementLinesByProductId" });
    Model.belongsTo(models["warehouses"], { foreignKey: "warehouse_id", targetKey: "warehouse_id", as: "warehouseId" });
    models["warehouses"].hasMany(Model, { foreignKey: "warehouse_id", sourceKey: "warehouse_id", as: "inventoryMovementLinesByWarehouseId" });
    Model.belongsTo(models["stock_lots"], { foreignKey: "lot_id", targetKey: "lot_id", as: "lotId" });
    models["stock_lots"].hasMany(Model, { foreignKey: "lot_id", sourceKey: "lot_id", as: "inventoryMovementLinesByLotId" });
    Model.belongsTo(models["receipt_lines"], { foreignKey: "receipt_line_id", targetKey: "receipt_line_id", as: "receiptLineId" });
    models["receipt_lines"].hasMany(Model, { foreignKey: "receipt_line_id", sourceKey: "receipt_line_id", as: "inventoryMovementLinesByReceiptLineId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "inventoryMovementLinesByCurrencyCode" });
  };
  return Model;
};
