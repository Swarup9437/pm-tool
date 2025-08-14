// src/routes/dev.js
const express = require('express');
const bcrypt = require('bcryptjs');
const {
  Employee, Project, Task, Resource, Assignment, Material, MaterialTransaction
} = require('../models');

const router = express.Router();

// Optional: disable in production for safety
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).send('Seed disabled in production');
  }
  next();
});

router.get('/dev/seed', async (req, res) => {
  try {
    await Employee.findOrCreate({
      where: { email: 'admin@company.com' },
      defaults: { name: 'System Admin', role: 'admin', password_hash: await bcrypt.hash('admin123', 10) },
    });

    const [pm] = await Employee.findOrCreate({
      where: { email: 'amit@company.com' },
      defaults: { name: 'Amit Kumar', role: 'pm', phone: '050-111-2222', password_hash: await bcrypt.hash('pm123', 10) },
    });

    const [proj] = await Project.findOrCreate({
      where: { code: 'P-001' },
      defaults: { name: 'Demo Project', client: 'Test Client', budget: 500000, project_manager_id: pm.id },
    });

    const [task] = await Task.findOrCreate({
      where: { name: 'Mobilization', project_id: proj.id },
      defaults: { wbs: '1.1', start: '2025-08-10', finish: '2025-08-15', percent_complete: 100, status: 'done', owner_id: pm.id },
    });

    const [res1] = await Resource.findOrCreate({
      where: { name: 'Crew A' },
      defaults: { type: 'labor', rate: 20, capacity_hours_per_week: 40 },
    });

    await Assignment.findOrCreate({
      where: { task_id: task.id, resource_id: res1.id },
      defaults: { hours: 24 },
    });

    const [mat1] = await Material.findOrCreate({
      where: { name: 'Cement' },
      defaults: { unit: 'bag', unit_cost: 4.5, quantity_on_hand: 120, reorder_level: 50, is_active: true },
    });
    const [mat2] = await Material.findOrCreate({
      where: { name: 'Steel Rods' },
      defaults: { unit: 'ton', unit_cost: 520, quantity_on_hand: 2, reorder_level: 5, is_active: true },
    });

    await MaterialTransaction.findOrCreate({
      where: { material_id: mat1.id, type: 'receive', quantity: 100, note: 'Initial stock' },
      defaults: { date: new Date().toISOString().slice(0,10) }
    });
    await MaterialTransaction.findOrCreate({
      where: { material_id: mat2.id, type: 'receive', quantity: 2, note: 'Initial stock' },
      defaults: { date: new Date().toISOString().slice(0,10) }
    });

    res.send('Seeded Admin, PM, Project, Task, Resource, Assignment, Materials. <a href="/">Go Home</a>');
  } catch (e) {
    res.status(500).send('Seed error: ' + e.message);
  }
});

module.exports = router;
