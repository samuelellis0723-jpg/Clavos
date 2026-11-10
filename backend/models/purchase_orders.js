'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("purchase_orders", {
    "purchase_order_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "po_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "requisition_id": { type: DataTypes.INTEGER },
    "contract_id": { type: DataTypes.INTEGER },
    "comparison_id": { type: DataTypes.INTEGER },
    "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false },
    "approved_by_user_id": { type: DataTypes.INTEGER },
    "ordered_at": { type: DataTypes.DATE },
    "expected_delivery_date": { type: DataTypes.DATEONLY },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "subtotal": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
    "tax_total": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
    "total_amount": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
    "status": { type: DataTypes.ENUM("draft", "sent", "acknowledged", "partially_received", "received", "cancelled", "closed"), allowNull: false, defaultValue: "draft" },
    "supplier_reference": { type: DataTypes.STRING(100) },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "purchase_orders", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "purchaseOrdersBySupplierId" });
    Model.belongsTo(models["requisitions"], { foreignKey: "requisition_id", targetKey: "requisition_id", as: "requisitionId" });
    models["requisitions"].hasMany(Model, { foreignKey: "requisition_id", sourceKey: "requisition_id", as: "purchaseOrdersByRequisitionId" });
    Model.belongsTo(models["contracts"], { foreignKey: "contract_id", targetKey: "contract_id", as: "contractId" });
    models["contracts"].hasMany(Model, { foreignKey: "contract_id", sourceKey: "contract_id", as: "purchaseOrdersByContractId" });
    Model.belongsTo(models["price_comparisons"], { foreignKey: "comparison_id", targetKey: "comparison_id", as: "comparisonId" });
    models["price_comparisons"].hasMany(Model, { foreignKey: "comparison_id", sourceKey: "comparison_id", as: "purchaseOrdersByComparisonId" });
    Model.belongsTo(models["users"], { foreignKey: "created_by_user_id", targetKey: "user_id", as: "createdByUserId" });
    models["users"].hasMany(Model, { foreignKey: "created_by_user_id", sourceKey: "user_id", as: "purchaseOrdersByCreatedByUserId" });
    Model.belongsTo(models["users"], { foreignKey: "approved_by_user_id", targetKey: "user_id", as: "approvedByUserId" });
    models["users"].hasMany(Model, { foreignKey: "approved_by_user_id", sourceKey: "user_id", as: "purchaseOrdersByApprovedByUserId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "purchaseOrdersByCurrencyCode" });
  };
  return Model;
};
