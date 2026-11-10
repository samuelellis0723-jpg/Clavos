'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("receipt_lines", {
    "receipt_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "receipt_id": { type: DataTypes.INTEGER, allowNull: false },
    "purchase_order_line_id": { type: DataTypes.INTEGER, allowNull: false },
    "quantity_received": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "quantity_accepted": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "quantity_rejected": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
    "rejection_reason": { type: DataTypes.TEXT },
    "lot_number": { type: DataTypes.STRING(100) },
    "expiration_date": { type: DataTypes.DATEONLY },
  }, { tableName: "receipt_lines", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["receipts"], { foreignKey: "receipt_id", targetKey: "receipt_id", as: "receiptId" });
    models["receipts"].hasMany(Model, { foreignKey: "receipt_id", sourceKey: "receipt_id", as: "receiptLinesByReceiptId" });
    Model.belongsTo(models["purchase_order_lines"], { foreignKey: "purchase_order_line_id", targetKey: "purchase_order_line_id", as: "purchaseOrderLineId" });
    models["purchase_order_lines"].hasMany(Model, { foreignKey: "purchase_order_line_id", sourceKey: "purchase_order_line_id", as: "receiptLinesByPurchaseOrderLineId" });
  };
  return Model;
};
