'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("requisition_order_allocations", {
    "allocation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "requisition_line_id": { type: DataTypes.INTEGER, allowNull: false },
    "purchase_order_line_id": { type: DataTypes.INTEGER, allowNull: false },
    "quantity_allocated": { type: DataTypes.DECIMAL(14,3), allowNull: false },
  }, { tableName: "requisition_order_allocations", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["requisition_lines"], { foreignKey: "requisition_line_id", targetKey: "requisition_line_id", as: "requisitionLineId" });
    models["requisition_lines"].hasMany(Model, { foreignKey: "requisition_line_id", sourceKey: "requisition_line_id", as: "requisitionOrderAllocationsByRequisitionLineId" });
    Model.belongsTo(models["purchase_order_lines"], { foreignKey: "purchase_order_line_id", targetKey: "purchase_order_line_id", as: "purchaseOrderLineId" });
    models["purchase_order_lines"].hasMany(Model, { foreignKey: "purchase_order_line_id", sourceKey: "purchase_order_line_id", as: "requisitionOrderAllocationsByPurchaseOrderLineId" });
  };
  return Model;
};
