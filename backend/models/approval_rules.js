'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("approval_rules", {
    "approval_rule_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "rule_name": { type: DataTypes.STRING(120), allowNull: false },
    "min_amount": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
    "max_amount": { type: DataTypes.DECIMAL(14,2) },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "step_order": { type: DataTypes.INTEGER, allowNull: false },
    "approver_role_id": { type: DataTypes.INTEGER, allowNull: false },
    "department_id": { type: DataTypes.INTEGER },
    "is_active": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    "valid_from": { type: DataTypes.DATEONLY },
    "valid_to": { type: DataTypes.DATEONLY },
    "description": { type: DataTypes.TEXT },
  }, { tableName: "approval_rules", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["roles"], { foreignKey: "approver_role_id", targetKey: "role_id", as: "approverRoleId" });
    models["roles"].hasMany(Model, { foreignKey: "approver_role_id", sourceKey: "role_id", as: "approvalRulesByApproverRoleId" });
    Model.belongsTo(models["departments"], { foreignKey: "department_id", targetKey: "department_id", as: "departmentId" });
    models["departments"].hasMany(Model, { foreignKey: "department_id", sourceKey: "department_id", as: "approvalRulesByDepartmentId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "approvalRulesByCurrencyCode" });
  };
  return Model;
};
