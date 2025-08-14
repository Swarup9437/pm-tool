// src/models/Assignment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Assignment = sequelize.define('Assignment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    hours: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },  // estimated/allocated hours on the task
  }, {
    tableName: 'assignments',
    timestamps: true,
  });

  return Assignment;
};
