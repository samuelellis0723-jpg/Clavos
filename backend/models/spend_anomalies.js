'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("spend_anomalies", {
    "anomaly_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "anomaly_type": { type: DataTypes.ENUM("duplicate_purchase", "duplicate_invoice", "off_contract", "overprice", "unusual_quantity", "split_purchase"), allowNull: false },
    "status": { type: DataTypes.ENUM("open", "under_review", "confirmed", "dismissed", "resolved"), allowNull: false, defaultValue: "open" },
    "detected_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "detected_by": { type: DataTypes.STRING(40), allowNull: false },
    "supplier_id": { type: DataTypes.INTEGER },
    "product_id": { type: DataTypes.INTEGER },
    "category_id": { type: DataTypes.INTEGER },
    "requisition_id": { type: DataTypes.INTEGER },
    "purchase_order_id": { type: DataTypes.INTEGER },
    "invoice_id": { type: DataTypes.INTEGER },
    "related_invoice_id": { type: DataTypes.INTEGER },
    "benchmark_price": { type: DataTypes.DECIMAL(14,4) },
    "observed_price": { type: DataTypes.DECIMAL(14,4) },
    "currency_code": { type: DataTypes.CHAR(3) },
    "variance_percent": { type: DataTypes.DECIMAL(9,4) },
    "explanation": { type: DataTypes.TEXT, allowNull: false },
    "reviewed_by_user_id": { type: DataTypes.INTEGER },
    "reviewed_at": { type: DataTypes.DATE },
    "resolution_notes": { type: DataTypes.TEXT },
  }, { tableName: "spend_anomalies", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "spendAnomaliesBySupplierId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "spendAnomaliesByProductId" });
    Model.belongsTo(models["expense_categories"], { foreignKey: "category_id", targetKey: "category_id", as: "categoryId" });
    models["expense_categories"].hasMany(Model, { foreignKey: "category_id", sourceKey: "category_id", as: "spendAnomaliesByCategoryId" });
    Model.belongsTo(models["requisitions"], { foreignKey: "requisition_id", targetKey: "requisition_id", as: "requisitionId" });
    models["requisitions"].hasMany(Model, { foreignKey: "requisition_id", sourceKey: "requisition_id", as: "spendAnomaliesByRequisitionId" });
    Model.belongsTo(models["purchase_orders"], { foreignKey: "purchase_order_id", targetKey: "purchase_order_id", as: "purchaseOrderId" });
    models["purchase_orders"].hasMany(Model, { foreignKey: "purchase_order_id", sourceKey: "purchase_order_id", as: "spendAnomaliesByPurchaseOrderId" });
    Model.belongsTo(models["supplier_invoices"], { foreignKey: "invoice_id", targetKey: "invoice_id", as: "invoiceId" });
    models["supplier_invoices"].hasMany(Model, { foreignKey: "invoice_id", sourceKey: "invoice_id", as: "spendAnomaliesByInvoiceId" });
    Model.belongsTo(models["supplier_invoices"], { foreignKey: "related_invoice_id", targetKey: "invoice_id", as: "relatedInvoiceId" });
    models["supplier_invoices"].hasMany(Model, { foreignKey: "related_invoice_id", sourceKey: "invoice_id", as: "spendAnomaliesByRelatedInvoiceId" });
    Model.belongsTo(models["users"], { foreignKey: "reviewed_by_user_id", targetKey: "user_id", as: "reviewedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "reviewed_by_user_id", sourceKey: "user_id", as: "spendAnomaliesByReviewedByUserId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "spendAnomaliesByCurrencyCode" });
  };
  return Model;
};
