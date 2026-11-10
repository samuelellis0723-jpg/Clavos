'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("roles", {
    "role_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "name": { type: DataTypes.STRING(80), allowNull: false, unique: true },
    "description": { type: DataTypes.TEXT },
  }, { tableName: "roles", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
