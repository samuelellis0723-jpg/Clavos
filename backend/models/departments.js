'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("departments", {
    "department_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "name": { type: DataTypes.STRING(120), allowNull: false, unique: true },
    "description": { type: DataTypes.TEXT },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "departments", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
