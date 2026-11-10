'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("stock_reservations", {
    "reservation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "warehouse_id": { type: DataTypes.INTEGER, allowNull: false },
    "quantity_reserved": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "reserved_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "expires_at": { type: DataTypes.DATE },
    "reference_type": { type: DataTypes.STRING(40) },
    "reference_id": { type: DataTypes.INTEGER },
    "released_at": { type: DataTypes.DATE },
    "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "stock_reservations", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "stockReservationsByProductId" });
    Model.belongsTo(models["warehouses"], { foreignKey: "warehouse_id", targetKey: "warehouse_id", as: "warehouseId" });
    models["warehouses"].hasMany(Model, { foreignKey: "warehouse_id", sourceKey: "warehouse_id", as: "stockReservationsByWarehouseId" });
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "stockReservationsByCreatedByUserId" });
  };
  return Model;
};
