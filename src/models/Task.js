const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    wbs: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING, allowNull: false },
    start: { type: DataTypes.DATEONLY },
    finish: { type: DataTypes.DATEONLY },
    percent_complete: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING }
  }, { tableName: 'tasks', timestamps: true });
};
