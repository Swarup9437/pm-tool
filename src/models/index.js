// src/models/index.js
const { sequelize } = require('../config/db');

const Employee   = require('./Employee')(sequelize);
const Project    = require('./Project')(sequelize);
const Task       = require('./Task')(sequelize);
const Resource   = require('./Resource')(sequelize);
const Assignment = require('./Assignment')(sequelize);

// ----- Associations -----
Employee.hasMany(Project, { foreignKey: 'project_manager_id', as: 'managedProjects' });
Project.belongsTo(Employee, { foreignKey: 'project_manager_id', as: 'projectManager' });

Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id' });

Employee.hasMany(Task, { foreignKey: 'owner_id', as: 'assignedTasks' });
Task.belongsTo(Employee, { foreignKey: 'owner_id', as: 'owner' });

// Resources ↔ Assignments ↔ Tasks
Resource.hasMany(Assignment, { foreignKey: 'resource_id', as: 'assignments' });
Assignment.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });

Task.hasMany(Assignment, { foreignKey: 'task_id', as: 'assignments' });
Assignment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

const Material = require('./Material')(sequelize);
const MaterialTransaction = require('./MaterialTransaction')(sequelize);

Material.hasMany(MaterialTransaction, { foreignKey: 'material_id', as: 'transactions' });
MaterialTransaction.belongsTo(Material, { foreignKey: 'material_id' });

module.exports = {
  sequelize, Employee, Project, Task, Resource, Assignment,
  Material, MaterialTransaction
};

