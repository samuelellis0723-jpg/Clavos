'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("supplier_products", {
    "supplier_product_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "supplier_sku": { type: DataTypes.STRING(100) },
    "supplier_product_name": { type: DataTypes.STRING(180) },
    "pack_quantity": { type: DataTypes.DECIMAL(12,3), allowNull: false, defaultValue: 1 },
    "purchase_unit_id": { type: DataTypes.INTEGER, allowNull: false },
    "minimum_order_quantity": { type: DataTypes.DECIMAL(12,3) },
    "lead_time_days": { type: DataTypes.INTEGER },
    "last_known_price": { type: DataTypes.DECIMAL(14,4) },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "is_preferred": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "supplier_products", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "supplierProductsBySupplierId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "supplierProductsByProductId" });
    Model.belongsTo(models["units_of_measure"], { foreignKey: "purchase_unit_id", targetKey: "unit_id", as: "purchaseUnitId" });
    models["units_of_measure"].hasMany(Model, { foreignKey: "purchase_unit_id", sourceKey: "unit_id", as: "supplierProductsByPurchaseUnitId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "supplierProductsByCurrencyCode" });
  };
  return Model;
};
