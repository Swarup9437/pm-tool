const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MaterialTransaction', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM('receive', 'consume', 'adjust'), allowNull: false },
    quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
    date: { type: DataTypes.DATEONLY },
    note: { type: DataTypes.STRING }
  }, { tableName: 'material_transactions', timestamps: true });
};
