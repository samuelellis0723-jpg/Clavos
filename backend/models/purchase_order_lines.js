'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("purchase_order_lines", {
    "purchase_order_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "purchase_order_id": { type: DataTypes.INTEGER, allowNull: false },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "contract_line_id": { type: DataTypes.INTEGER },
    "supplier_product_id": { type: DataTypes.INTEGER },
    "description": { type: DataTypes.STRING(250) },
    "quantity_ordered": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "unit_id": { type: DataTypes.INTEGER, allowNull: false },
    "unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
    "tax_rate": { type: DataTypes.DECIMAL(7,4), allowNull: false, defaultValue: 0 },
    "line_total": { type: DataTypes.DECIMAL(14,2), allowNull: false },
    "category_id": { type: DataTypes.INTEGER, allowNull: false },
    "expected_delivery_date": { type: DataTypes.DATEONLY },
  }, { tableName: "purchase_order_lines", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["purchase_orders"], { foreignKey: "purchase_order_id", targetKey: "purchase_order_id", as: "purchaseOrderId" });
    models["purchase_orders"].hasMany(Model, { foreignKey: "purchase_order_id", sourceKey: "purchase_order_id", as: "purchaseOrderLinesByPurchaseOrderId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "purchaseOrderLinesByProductId" });
    Model.belongsTo(models["contract_lines"], { foreignKey: "contract_line_id", targetKey: "contract_line_id", as: "contractLineId" });
    models["contract_lines"].hasMany(Model, { foreignKey: "contract_line_id", sourceKey: "contract_line_id", as: "purchaseOrderLinesByContractLineId" });
    Model.belongsTo(models["supplier_products"], { foreignKey: "supplier_product_id", targetKey: "supplier_product_id", as: "supplierProductId" });
    models["supplier_products"].hasMany(Model, { foreignKey: "supplier_product_id", sourceKey: "supplier_product_id", as: "purchaseOrderLinesBySupplierProductId" });
    Model.belongsTo(models["units_of_measure"], { foreignKey: "unit_id", targetKey: "unit_id", as: "unitId" });
    models["units_of_measure"].hasMany(Model, { foreignKey: "unit_id", sourceKey: "unit_id", as: "purchaseOrderLinesByUnitId" });
    Model.belongsTo(models["expense_categories"], { foreignKey: "category_id", targetKey: "category_id", as: "categoryId" });
    models["expense_categories"].hasMany(Model, { foreignKey: "category_id", sourceKey: "category_id", as: "purchaseOrderLinesByCategoryId" });
  };
  return Model;
};
