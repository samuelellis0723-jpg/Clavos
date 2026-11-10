'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("units_of_measure", {
    "unit_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "code": { type: DataTypes.STRING(20), allowNull: false, unique: true },
    "name": { type: DataTypes.STRING(80), allowNull: false },
    "allows_decimal": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: "units_of_measure", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
