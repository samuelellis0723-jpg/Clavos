'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("evaluation_criteria", {
    "criterion_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "name": { type: DataTypes.STRING(100), allowNull: false, unique: true },
    "description": { type: DataTypes.TEXT },
    "default_weight": { type: DataTypes.DECIMAL(7,4), allowNull: false },
    "higher_is_better": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    "is_active": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: "evaluation_criteria", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
