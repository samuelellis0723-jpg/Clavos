'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("supplier_evaluation_scores", {
    "evaluation_score_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "evaluation_id": { type: DataTypes.INTEGER, allowNull: false },
    "criterion_id": { type: DataTypes.INTEGER, allowNull: false },
    "weight_used": { type: DataTypes.DECIMAL(7,4), allowNull: false },
    "score": { type: DataTypes.DECIMAL(7,4), allowNull: false },
    "weighted_score": { type: DataTypes.DECIMAL(8,4), allowNull: false },
    "evidence": { type: DataTypes.TEXT },
  }, { tableName: "supplier_evaluation_scores", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["supplier_evaluations"], { foreignKey: "evaluation_id", targetKey: "evaluation_id", as: "evaluationId" });
    models["supplier_evaluations"].hasMany(Model, { foreignKey: "evaluation_id", sourceKey: "evaluation_id", as: "supplierEvaluationScoresByEvaluationId" });
    Model.belongsTo(models["evaluation_criteria"], { foreignKey: "criterion_id", targetKey: "criterion_id", as: "criterionId" });
    models["evaluation_criteria"].hasMany(Model, { foreignKey: "criterion_id", sourceKey: "criterion_id", as: "supplierEvaluationScoresByCriterionId" });
  };
  return Model;
};
