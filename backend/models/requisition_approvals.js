'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("requisition_approvals", {
    "requisition_approval_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "requisition_id": { type: DataTypes.INTEGER, allowNull: false },
    "approval_rule_id": { type: DataTypes.INTEGER, allowNull: false },
    "step_order": { type: DataTypes.INTEGER, allowNull: false },
    "approver_user_id": { type: DataTypes.INTEGER },
    "status": { type: DataTypes.ENUM("pending", "approved", "rejected", "skipped"), allowNull: false, defaultValue: "pending" },
    "assigned_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "decided_at": { type: DataTypes.DATE },
    "comments": { type: DataTypes.TEXT },
  }, { tableName: "requisition_approvals", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["requisitions"], { foreignKey: "requisition_id", targetKey: "requisition_id", as: "requisitionId" });
    models["requisitions"].hasMany(Model, { foreignKey: "requisition_id", sourceKey: "requisition_id", as: "requisitionApprovalsByRequisitionId" });
    Model.belongsTo(models["approval_rules"], { foreignKey: "approval_rule_id", targetKey: "approval_rule_id", as: "approvalRuleId" });
    models["approval_rules"].hasMany(Model, { foreignKey: "approval_rule_id", sourceKey: "approval_rule_id", as: "requisitionApprovalsByApprovalRuleId" });
    Model.belongsTo(models["users"], { foreignKey: "approver_user_id", targetKey: "user_id", as: "approverUserId" });
    models["users"].hasMany(Model, { foreignKey: "approver_user_id", sourceKey: "user_id", as: "requisitionApprovalsByApproverUserId" });
  };
  return Model;
};
