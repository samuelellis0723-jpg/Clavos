'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("requisition_lines", {
    "requisition_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "requisition_id": { type: DataTypes.INTEGER, allowNull: false },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "category_id": { type: DataTypes.INTEGER, allowNull: false },
    "quantity_requested": { type: DataTypes.DECIMAL(14,3), allowNull: false },
    "unit_id": { type: DataTypes.INTEGER, allowNull: false },
    "estimated_unit_price": { type: DataTypes.DECIMAL(14,4) },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "preferred_supplier_id": { type: DataTypes.INTEGER },
    "needed_by_date": { type: DataTypes.DATEONLY },
    "specification": { type: DataTypes.TEXT },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "requisition_lines", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["requisitions"], { foreignKey: "requisition_id", targetKey: "requisition_id", as: "requisitionId" });
    models["requisitions"].hasMany(Model, { foreignKey: "requisition_id", sourceKey: "requisition_id", as: "requisitionLinesByRequisitionId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "requisitionLinesByProductId" });
    Model.belongsTo(models["expense_categories"], { foreignKey: "category_id", targetKey: "category_id", as: "categoryId" });
    models["expense_categories"].hasMany(Model, { foreignKey: "category_id", sourceKey: "category_id", as: "requisitionLinesByCategoryId" });
    Model.belongsTo(models["units_of_measure"], { foreignKey: "unit_id", targetKey: "unit_id", as: "unitId" });
    models["units_of_measure"].hasMany(Model, { foreignKey: "unit_id", sourceKey: "unit_id", as: "requisitionLinesByUnitId" });
    Model.belongsTo(models["suppliers"], { foreignKey: "preferred_supplier_id", targetKey: "supplier_id", as: "preferredSupplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "preferred_supplier_id", sourceKey: "supplier_id", as: "requisitionLinesByPreferredSupplierId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "requisitionLinesByCurrencyCode" });
  };
  return Model;
};
