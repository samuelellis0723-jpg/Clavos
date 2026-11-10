'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("price_sources", {
    "price_source_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "source_name": { type: DataTypes.STRING(120), allowNull: false, unique: true },
    "source_type": { type: DataTypes.STRING(40), allowNull: false },
    "base_url": { type: DataTypes.STRING(255) },
    "update_frequency": { type: DataTypes.STRING(60) },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "price_sources", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
  };
  return Model;
};
