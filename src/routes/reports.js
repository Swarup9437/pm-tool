// src/routes/reports.js
const express = require('express');
const { Project, Task, Assignment, Resource, Material, MaterialTransaction } = require('../models');

const router = express.Router();

router.get('/reports/costs-page', async (req, res) => {
  const projects = await Project.findAll();
  const txs = await MaterialTransaction.findAll({ include: [{ model: Material }] });
  const companyMaterialConsume = txs
    .filter(t => t.type === 'consume' && t.Material)
    .reduce((sum, t) => sum + Number(t.quantity || 0) * Number(t.Material.unit_cost || 0), 0);

  const rows = [];
  for (const p of projects) {
    const tasks = await Task.findAll({ where: { project_id: p.id } });
    const taskIds = tasks.map(t => t.id);
    let laborActual = 0;
    if (taskIds.length) {
      const assignments = await Assignment.findAll({ where: { task_id: taskIds }, include: [{ model: Resource, as: 'resource' }] });
      laborActual = assignments.reduce((sum, a) => sum + Number(a.hours || 0) * Number(a.resource?.rate || 0), 0);
    }
    const planned = Number(p.budget || 0);
    rows.push({ code: p.code, name: p.name, planned, laborActual, totalActual: laborActual, variance: planned - laborActual });
  }

  const tr = rows.map(r => `
    <tr>
      <td>${r.code}</td><td>${r.name}</td>
      <td style="text-align:right;">${r.planned.toLocaleString()}</td>
      <td style="text-align:right;">${r.laborActual.toLocaleString()}</td>
      <td style="text-align:right;">${r.totalActual.toLocaleString()}</td>
      <td style="text-align:right; ${r.variance < 0 ? 'color:red;' : ''}">${r.variance.toLocaleString()}</td>
    </tr>
  `).join('');

  res.send(`
    <h2>Budget vs Actual (Labor)</h2>
    <p><a href="/">Home</a></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>Project Code</th><th>Name</th><th>Planned</th><th>Labor Actual</th><th>Total Actual</th><th>Variance</th></tr></thead>
      <tbody>${tr}</tbody>
    </table>
    <div style="margin-top:16px; padding:12px; background:#f8f9fa;">
      <h3>Material Consumption (Company-wide)</h3>
      <p><strong>Consumed cost so far:</strong> ${companyMaterialConsume.toLocaleString()}</p>
    </div>
  `);
});

module.exports = router;
