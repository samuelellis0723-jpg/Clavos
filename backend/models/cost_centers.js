'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("cost_centers", {
    "cost_center_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "code": { type: DataTypes.STRING(30), allowNull: false, unique: true },
    "name": { type: DataTypes.STRING(120), allowNull: false },
    "department_id": { type: DataTypes.INTEGER, allowNull: false },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
  }, { tableName: "cost_centers", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["departments"], { foreignKey: "department_id", targetKey: "department_id", as: "departmentId" });
    models["departments"].hasMany(Model, { foreignKey: "department_id", sourceKey: "department_id", as: "costCentersByDepartmentId" });
  };
  return Model;
};
