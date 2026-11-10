'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("expense_categories", {
    "category_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "parent_category_id": { type: DataTypes.INTEGER },
    "code": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "name": { type: DataTypes.STRING(120), allowNull: false },
    "description": { type: DataTypes.TEXT },
    "is_capital_expense": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "expense_categories", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["expense_categories"], { foreignKey: "parent_category_id", targetKey: "category_id", as: "parentCategoryId" });
    models["expense_categories"].hasMany(Model, { foreignKey: "parent_category_id", sourceKey: "category_id", as: "expenseCategoriesByParentCategoryId" });
  };
  return Model;
};
