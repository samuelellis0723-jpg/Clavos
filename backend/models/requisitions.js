'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("requisitions", {
    "requisition_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "requisition_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "requester_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "department_id": { type: DataTypes.INTEGER, allowNull: false },
    "cost_center_id": { type: DataTypes.INTEGER, allowNull: false },
    "requested_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "needed_by_date": { type: DataTypes.DATEONLY },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "estimated_total": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
    "business_justification": { type: DataTypes.TEXT, allowNull: false },
    "status": { type: DataTypes.ENUM("draft", "submitted", "under_review", "approved", "rejected", "cancelled", "partially_ordered", "ordered", "closed"), allowNull: false, defaultValue: "draft" },
    "submitted_at": { type: DataTypes.DATE },
    "closed_at": { type: DataTypes.DATE },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "requisitions", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["users"], { foreignKey: "requester_user_id", targetKey: "user_id", as: "requesterUserId" });
    models["users"].hasMany(Model, { foreignKey: "requester_user_id", sourceKey: "user_id", as: "requisitionsByRequesterUserId" });
    Model.belongsTo(models["departments"], { foreignKey: "department_id", targetKey: "department_id", as: "departmentId" });
    models["departments"].hasMany(Model, { foreignKey: "department_id", sourceKey: "department_id", as: "requisitionsByDepartmentId" });
    Model.belongsTo(models["cost_centers"], { foreignKey: "cost_center_id", targetKey: "cost_center_id", as: "costCenterId" });
    models["cost_centers"].hasMany(Model, { foreignKey: "cost_center_id", sourceKey: "cost_center_id", as: "requisitionsByCostCenterId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "requisitionsByCurrencyCode" });
  };
  return Model;
};
