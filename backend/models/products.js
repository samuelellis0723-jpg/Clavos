'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("products", {
    "product_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "sku": { type: DataTypes.STRING(60), allowNull: false, unique: true },
    "barcode": { type: DataTypes.STRING(80), unique: true },
    "name": { type: DataTypes.STRING(180), allowNull: false },
    "description": { type: DataTypes.TEXT },
    "brand": { type: DataTypes.STRING(100) },
    "model": { type: DataTypes.STRING(100) },
    "unit_id": { type: DataTypes.INTEGER, allowNull: false },
    "category_id": { type: DataTypes.INTEGER, allowNull: false },
    "is_stockable": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "updated_at": { type: DataTypes.DATE },
  }, { tableName: "products", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["units_of_measure"], { foreignKey: "unit_id", targetKey: "unit_id", as: "unitId" });
    models["units_of_measure"].hasMany(Model, { foreignKey: "unit_id", sourceKey: "unit_id", as: "productsByUnitId" });
    Model.belongsTo(models["expense_categories"], { foreignKey: "category_id", targetKey: "category_id", as: "categoryId" });
    models["expense_categories"].hasMany(Model, { foreignKey: "category_id", sourceKey: "category_id", as: "productsByCategoryId" });
  };
  return Model;
};
