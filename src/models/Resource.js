// src/models/Resource.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Resource = sequelize.define('Resource', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('labor', 'equipment'), allowNull: false, defaultValue: 'labor' },
    rate: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },          // per hour (labor) or per use (equipment)
    capacity_hours_per_week: { type: DataTypes.INTEGER, defaultValue: 40 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'resources',
    timestamps: true,
  });

  return Resource;
};
