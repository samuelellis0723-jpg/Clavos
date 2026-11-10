'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("payment_allocations", {
    "payment_allocation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "payment_id": { type: DataTypes.INTEGER, allowNull: false },
    "invoice_id": { type: DataTypes.INTEGER, allowNull: false },
    "amount_applied": { type: DataTypes.DECIMAL(14,2), allowNull: false },
  }, { tableName: "payment_allocations", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["payments"], { foreignKey: "payment_id", targetKey: "payment_id", as: "paymentId" });
    models["payments"].hasMany(Model, { foreignKey: "payment_id", sourceKey: "payment_id", as: "paymentAllocationsByPaymentId" });
    Model.belongsTo(models["supplier_invoices"], { foreignKey: "invoice_id", targetKey: "invoice_id", as: "invoiceId" });
    models["supplier_invoices"].hasMany(Model, { foreignKey: "invoice_id", sourceKey: "invoice_id", as: "paymentAllocationsByInvoiceId" });
  };
  return Model;
};
