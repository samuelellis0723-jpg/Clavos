'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("price_import_batches", {
    "import_batch_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "price_source_id": { type: DataTypes.INTEGER, allowNull: false },
    "started_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "completed_at": { type: DataTypes.DATE },
    "imported_by_user_id": { type: DataTypes.INTEGER },
    "records_received": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    "records_imported": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    "records_rejected": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    "status": { type: DataTypes.STRING(30), allowNull: false },
    "error_summary": { type: DataTypes.TEXT },
  }, { tableName: "price_import_batches", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["price_sources"], { foreignKey: "price_source_id", targetKey: "price_source_id", as: "priceSourceId" });
    models["price_sources"].hasMany(Model, { foreignKey: "price_source_id", sourceKey: "price_source_id", as: "priceImportBatchesByPriceSourceId" });
    Model.belongsTo(models["users"], { foreignKey: "imported_by_user_id", targetKey: "user_id", as: "importedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "imported_by_user_id", sourceKey: "user_id", as: "priceImportBatchesByImportedByUserId" });
  };
  return Model;
};
