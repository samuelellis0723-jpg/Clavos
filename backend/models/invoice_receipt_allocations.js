'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("invoice_receipt_allocations", {
    "invoice_receipt_allocation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "invoice_line_id": { type: DataTypes.INTEGER, allowNull: false },
    "receipt_line_id": { type: DataTypes.INTEGER, allowNull: false },
    "quantity_matched": { type: DataTypes.DECIMAL(14,3), allowNull: false },
  }, { tableName: "invoice_receipt_allocations", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["invoice_lines"], { foreignKey: "invoice_line_id", targetKey: "invoice_line_id", as: "invoiceLineId" });
    models["invoice_lines"].hasMany(Model, { foreignKey: "invoice_line_id", sourceKey: "invoice_line_id", as: "invoiceReceiptAllocationsByInvoiceLineId" });
    Model.belongsTo(models["receipt_lines"], { foreignKey: "receipt_line_id", targetKey: "receipt_line_id", as: "receiptLineId" });
    models["receipt_lines"].hasMany(Model, { foreignKey: "receipt_line_id", sourceKey: "receipt_line_id", as: "invoiceReceiptAllocationsByReceiptLineId" });
  };
  return Model;
};
