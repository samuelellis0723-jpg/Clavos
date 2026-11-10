'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("invoice_lines", {
    "invoice_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "invoice_id": { type: DataTypes.INTEGER, allowNull: false },
    "purchase_order_line_id": { type: DataTypes.INTEGER },
    "product_id": { type: DataTypes.INTEGER },
    "description": { type: DataTypes.STRING(250), allowNull: false },
    "quantity_invoiced": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "unit_id": { type: DataTypes.INTEGER },
    "unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
    "tax_rate": { type: DataTypes.DECIMAL(7,4), allowNull: false, defaultValue: 0 },
    "line_total": { type: DataTypes.DECIMAL(14,2), allowNull: false },
    "category_id": { type: DataTypes.INTEGER },
  }, { tableName: "invoice_lines", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["supplier_invoices"], { foreignKey: "invoice_id", targetKey: "invoice_id", as: "invoiceId" });
    models["supplier_invoices"].hasMany(Model, { foreignKey: "invoice_id", sourceKey: "invoice_id", as: "invoiceLinesByInvoiceId" });
    Model.belongsTo(models["purchase_order_lines"], { foreignKey: "purchase_order_line_id", targetKey: "purchase_order_line_id", as: "purchaseOrderLineId" });
    models["purchase_order_lines"].hasMany(Model, { foreignKey: "purchase_order_line_id", sourceKey: "purchase_order_line_id", as: "invoiceLinesByPurchaseOrderLineId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "invoiceLinesByProductId" });
    Model.belongsTo(models["units_of_measure"], { foreignKey: "unit_id", targetKey: "unit_id", as: "unitId" });
    models["units_of_measure"].hasMany(Model, { foreignKey: "unit_id", sourceKey: "unit_id", as: "invoiceLinesByUnitId" });
    Model.belongsTo(models["expense_categories"], { foreignKey: "category_id", targetKey: "category_id", as: "categoryId" });
    models["expense_categories"].hasMany(Model, { foreignKey: "category_id", sourceKey: "category_id", as: "invoiceLinesByCategoryId" });
  };
  return Model;
};
