'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("supplier_invoices", {
    "invoice_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "purchase_order_id": { type: DataTypes.INTEGER },
    "invoice_number": { type: DataTypes.STRING(100), allowNull: false },
    "invoice_date": { type: DataTypes.DATEONLY, allowNull: false },
    "due_date": { type: DataTypes.DATEONLY },
    "received_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "subtotal": { type: DataTypes.DECIMAL(14,2), allowNull: false },
    "tax_total": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
    "total_amount": { type: DataTypes.DECIMAL(14,2), allowNull: false },
    "status": { type: DataTypes.ENUM("received", "under_review", "matched", "disputed", "approved", "partially_paid", "paid", "cancelled"), allowNull: false, defaultValue: "received" },
    "document_url": { type: DataTypes.STRING(500) },
    "reviewed_by_user_id": { type: DataTypes.INTEGER },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "supplier_invoices", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "supplierInvoicesBySupplierId" });
    Model.belongsTo(models["purchase_orders"], { foreignKey: "purchase_order_id", targetKey: "purchase_order_id", as: "purchaseOrderId" });
    models["purchase_orders"].hasMany(Model, { foreignKey: "purchase_order_id", sourceKey: "purchase_order_id", as: "supplierInvoicesByPurchaseOrderId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "supplierInvoicesByCurrencyCode" });
    Model.belongsTo(models["users"], { foreignKey: "reviewed_by_user_id", targetKey: "user_id", as: "reviewedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "reviewed_by_user_id", sourceKey: "user_id", as: "supplierInvoicesByReviewedByUserId" });
  };
  return Model;
};
