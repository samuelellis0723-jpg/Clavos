'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("users", {
    "user_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "department_id": { type: DataTypes.INTEGER },
    "full_name": { type: DataTypes.STRING(160), allowNull: false },
    "email": { type: DataTypes.STRING(180), allowNull: false, unique: true },
    "job_title": { type: DataTypes.STRING(120) },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
    "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "users", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["departments"], { foreignKey: "department_id", targetKey: "department_id", as: "departmentId" });
    models["departments"].hasMany(Model, { foreignKey: "department_id", sourceKey: "department_id", as: "usersByDepartmentId" });
  };
  return Model;
};
