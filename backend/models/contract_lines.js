'use strict';

module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("contract_lines", {
    "contract_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    "contract_id": { type: DataTypes.INTEGER, allowNull: false },
    "product_id": { type: DataTypes.INTEGER, allowNull: false },
    "agreed_unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
    "currency_code": { type: DataTypes.CHAR(3), allowNull: false },
    "minimum_quantity": { type: DataTypes.DECIMAL(14,3) },
    "maximum_quantity": { type: DataTypes.DECIMAL(14,3) },
    "unit_id": { type: DataTypes.INTEGER, allowNull: false },
    "notes": { type: DataTypes.TEXT },
  }, { tableName: "contract_lines", timestamps: false, freezeTableName: true });
  Model.associate = (models) => {
    Model.belongsTo(models["contracts"], { foreignKey: "contract_id", targetKey: "contract_id", as: "contractId" });
    models["contracts"].hasMany(Model, { foreignKey: "contract_id", sourceKey: "contract_id", as: "contractLinesByContractId" });
    Model.belongsTo(models["products"], { foreignKey: "product_id", targetKey: "product_id", as: "productId" });
    models["products"].hasMany(Model, { foreignKey: "product_id", sourceKey: "product_id", as: "contractLinesByProductId" });
    Model.belongsTo(models["units_of_measure"], { foreignKey: "unit_id", targetKey: "unit_id", as: "unitId" });
    models["units_of_measure"].hasMany(Model, { foreignKey: "unit_id", sourceKey: "unit_id", as: "contractLinesByUnitId" });
    Model.belongsTo(models["currencies"], { foreignKey: "currency_code", targetKey: "currency_code", as: "currencyCode" });
    models["currencies"].hasMany(Model, { foreignKey: "currency_code", sourceKey: "currency_code", as: "contractLinesByCurrencyCode" });
  };
  return Model;
};
