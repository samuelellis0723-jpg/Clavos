'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("supplier_evaluations", {
    "evaluation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "evaluation_period_start": { type: DataTypes.DATEONLY },
    "evaluation_period_end": { type: DataTypes.DATEONLY },
    "evaluated_by_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "evaluated_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "status": { type: DataTypes.ENUM("draft", "submitted", "approved", "rejected"), allowNull: false, defaultValue: "draft" },
    "total_weighted_score": { type: DataTypes.DECIMAL(8,4) },
    "recommendation": { type: DataTypes.TEXT },
  }, { tableName: "supplier_evaluations", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "supplierEvaluationsBySupplierId" });
    Model.belongsTo(models["users"], { foreignKey: "evaluated_by_user_id", targetKey: "user_id", as: "evaluatedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "evaluated_by_user_id", sourceKey: "user_id", as: "supplierEvaluationsByEvaluatedByUserId" });
  };
  return Model;
};
