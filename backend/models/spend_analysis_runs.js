'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("spend_analysis_runs", {
    "analysis_run_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "started_at": { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    "completed_at": { type: DataTypes.DATE },
    "created_by_user_id": { type: DataTypes.INTEGER },
    "date_from": { type: DataTypes.DATEONLY, allowNull: false },
    "date_to": { type: DataTypes.DATEONLY, allowNull: false },
    "rules_version": { type: DataTypes.STRING(40) },
    "anomalies_found": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    "status": { type: DataTypes.STRING(30), allowNull: false },
    "summary": { type: DataTypes.TEXT },
  }, { tableName: "spend_analysis_runs", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "spendAnalysisRunsByCreatedByUserId" });
  };
  return Model;
};
