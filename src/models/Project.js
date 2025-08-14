const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Project', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    client: { type: DataTypes.STRING },
    budget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
  }, { tableName: 'projects', timestamps: true });
};
