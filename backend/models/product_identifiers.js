'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("product_identifiers", {
    "identifier_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "identifier_type": { type: DataTypes.STRING(40), allowNull: false },
    "identifier_value": { type: DataTypes.STRING(120), allowNull: false },
    "source_name": { type: DataTypes.STRING(100) },
  }, { tableName: "product_identifiers", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "productIdentifiersByProductId" });
  };
  return Model;
};
