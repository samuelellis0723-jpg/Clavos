'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("supplier_contacts", {
    "contact_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "supplier_id": { type: DataTypes.INTEGER, allowNull: false },
    "full_name": { type: DataTypes.STRING(160), allowNull: false },
    "email": { type: DataTypes.STRING(180) },
    "phone": { type: DataTypes.STRING(40) },
    "role_title": { type: DataTypes.STRING(100) },
    "is_primary": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
  }, { tableName: "supplier_contacts", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["suppliers"], { foreignKey: "supplier_id", targetKey: "supplier_id", as: "supplierId" });
    models["suppliers"].hasMany(Model, { foreignKey: "supplier_id", sourceKey: "supplier_id", as: "supplierContactsBySupplierId" });
  };
  return Model;
};
