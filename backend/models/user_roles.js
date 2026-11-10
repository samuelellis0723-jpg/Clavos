'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("user_roles", {
    "user_id": { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    "role_id": { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    "assigned_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: "user_roles", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["users"], { foreignKey: "user_id", targetKey: "user_id", as: "userId" });
    models["users"].hasMany(Model, { foreignKey: "user_id", sourceKey: "user_id", as: "userRolesByUserId" });
    Model.belongsTo(models["roles"], { foreignKey: "role_id", targetKey: "role_id", as: "roleId" });
    models["roles"].hasMany(Model, { foreignKey: "role_id", sourceKey: "role_id", as: "userRolesByRoleId" });
  };
  return Model;
};
