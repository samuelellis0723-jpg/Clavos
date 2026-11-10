'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("receipts", {
    "receipt_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "receipt_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "purchase_order_id": { type: DataTypes.INTEGER, allowNull: false },
    "received_by_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "received_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "status": { type: DataTypes.ENUM("draft", "posted", "cancelled"), allowNull: false, defaultValue: "draft" },
    "delivery_note_number": { type: DataTypes.STRING(100) },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "receipts", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["purchase_orders"], { foreignKey: "purchase_order_id", targetKey: "purchase_order_id", as: "purchaseOrderId" });
    models["purchase_orders"].hasMany(Model, { foreignKey: "purchase_order_id", sourceKey: "purchase_order_id", as: "receiptsByPurchaseOrderId" });
    Model.belongsTo(models["users"], { foreignKey: "received_by_user_id", targetKey: "user_id", as: "receivedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "received_by_user_id", sourceKey: "user_id", as: "receiptsByReceivedByUserId" });
  };
  return Model;
};
