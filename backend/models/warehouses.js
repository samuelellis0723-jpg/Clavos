'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("warehouses", {
    "warehouse_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "code": { type: DataTypes.STRING(30), allowNull: false, unique: true },
    "name": { type: DataTypes.STRING(120), allowNull: false },
    "address": { type: DataTypes.TEXT },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
  }, { tableName: "warehouses", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
