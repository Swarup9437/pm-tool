const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Material', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    unit: { type: DataTypes.STRING, defaultValue: 'unit' },
    unit_cost: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    quantity_on_hand: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    reorder_level: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'materials', timestamps: true });
};
