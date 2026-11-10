'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("currencies", {
    "currency_code": { type: DataTypes.CHAR(3), primaryKey: true },
    "name": { type: DataTypes.STRING(60), allowNull: false },
    "symbol": { type: DataTypes.STRING(8) },
    "decimal_places": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
  }, { tableName: "currencies", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
