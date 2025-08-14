const { DataTypes } = require('sequelize');

// ...
module.exports = (sequelize) => {
  return sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: { type: DataTypes.STRING, allowNull: false }, // 'admin','pm','engineer','viewer'
    phone: { type: DataTypes.STRING },
    password_hash: { type: DataTypes.STRING } // <-- add this
  }, { tableName: 'employees', timestamps: true });
};
