'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("price_comparison_items", {
    "comparison_item_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "comparison_id": { type: DataTypes.INTEGER, allowNull: false },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "supplier_product_id": { type: DataTypes.INTEGER },
    "price_observation_id": { type: DataTypes.INTEGER },
    "quoted_unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "quantity_quoted": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "lead_time_days": { type: DataTypes.INTEGER },
    "quality_note": { type: DataTypes.TEXT },
    "payment_terms_days": { type: DataTypes.INTEGER },
    "is_selected": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    "selection_reason": { type: DataTypes.TEXT },
  }, { tableName: "price_comparison_items", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["price_comparisons"], { foreignKey: "comparison_id", targetKey: "comparison_id", as: "comparisonId" });
    models["price_comparisons"].hasMany(Model, { foreignKey: "comparison_id", sourceKey: "comparison_id", as: "priceComparisonItemsByComparisonId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "priceComparisonItemsByProductId" });
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "priceComparisonItemsBySupplierId" });
    Model.belongsTo(models["supplier_products"], { foreignKey: "supplier_product_id", targetKey: "supplier_product_id", as: "supplierProductId" });
    models["supplier_products"].hasMany(Model, { foreignKey: "supplier_product_id", sourceKey: "supplier_product_id", as: "priceComparisonItemsBySupplierProductId" });
    Model.belongsTo(models["supplier_price_observations"], { foreignKey: "price_observation_id", targetKey: "price_observation_id", as: "priceObservationId" });
    models["supplier_price_observations"].hasMany(Model, { foreignKey: "price_observation_id", sourceKey: "price_observation_id", as: "priceComparisonItemsByPriceObservationId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "priceComparisonItemsByCurrencyCode" });
  };
  return Model;
};
