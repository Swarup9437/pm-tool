// src/config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'data/dev.sqlite',
  logging: false
});

module.exports = { sequelize };
