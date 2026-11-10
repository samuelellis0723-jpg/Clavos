'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("supplier_price_observations", {
    "price_observation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_product_id": { type: DataTypes.INTEGER, allowNull: false },
    "price_source_id": { type: DataTypes.INTEGER, allowNull: false },
    "import_batch_id": { type: DataTypes.INTEGER },
    "observed_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "price_includes_tax": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    "available_quantity": { type: DataTypes.DECIMAL(14,3) },
    "source_product_url": { type: DataTypes.STRING(500) },
    "external_reference": { type: DataTypes.STRING(150) },
    "is_validated": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: "supplier_price_observations", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["supplier_products"], { foreignKey: "supplier_product_id", targetKey: "supplier_product_id", as: "supplierProductId" });
    models["supplier_products"].hasMany(Model, { foreignKey: "supplier_product_id", sourceKey: "supplier_product_id", as: "supplierPriceObservationsBySupplierProductId" });
    Model.belongsTo(models["price_sources"], { foreignKey: "price_source_id", targetKey: "price_source_id", as: "priceSourceId" });
    models["price_sources"].hasMany(Model, { foreignKey: "price_source_id", sourceKey: "price_source_id", as: "supplierPriceObservationsByPriceSourceId" });
    Model.belongsTo(models["price_import_batches"], { foreignKey: "import_batch_id", targetKey: "import_batch_id", as: "importBatchId" });
    models["price_import_batches"].hasMany(Model, { foreignKey: "import_batch_id", sourceKey: "import_batch_id", as: "supplierPriceObservationsByImportBatchId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "supplierPriceObservationsByCurrencyCode" });
  };
  return Model;
};
