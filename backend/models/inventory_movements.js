'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("inventory_movements", {
    "inventory_movement_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "movement_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "movement_type": { type: DataTypes.ENUM("receipt", "sale", "return", "transfer_in", "transfer_out", "adjustment_in", "adjustment_out", "reservation", "release", "damage", "stock_count"), allowNull: false },
    "movement_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "reference_type": { type: DataTypes.STRING(40) },
    "reference_id": { type: DataTypes.INTEGER },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "inventory_movements", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "inventoryMovementsByCreatedByUserId" });
  };
  return Model;
};
