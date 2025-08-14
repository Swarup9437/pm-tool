// src/routes/dashboard.js
const express = require('express');
const { sequelize, Employee, Project, Task, Resource, Assignment, Material } = require('../models');
const { currentUser } = require('../middleware/auth');

const router = express.Router();

/* Home (Embedded Dashboard) */
router.get('/', async (req, res) => {
  const me = await currentUser(req);

  const [totalProjects, totalEmployees, totalTasks, totalResources, totalMaterials] = await Promise.all([
    Project.count(), Employee.count(), Task.count(), Resource.count(), Material.count()
  ]);

  const taskStatusCounts = await Task.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
    group: ['status'],
  });
  const statusLabels = taskStatusCounts.map((t) => t.status || 'unknown');
  const statusValues = taskStatusCounts.map((t) => Number(t.dataValues.count));

  const resources = await Resource.findAll({ include: [{ model: Assignment, as: 'assignments' }] });
  const utilRows = resources.map((r) => {
    const assigned = (r.assignments || []).reduce((s, a) => s + Number(a.hours || 0), 0);
    const cap = Number(r.capacity_hours_per_week || 0);
    const util = cap > 0 ? Math.min(100, Math.round((assigned / cap) * 100)) : 0;
    return { name: r.name, assigned, cap, util };
  });
  const utilLabels = utilRows.map((r) => r.name);
  const utilValues = utilRows.map((r) => r.util);

  const materials = await Material.findAll();
  const lowStock = materials.filter((m) => Number(m.quantity_on_hand || 0) <= Number(m.reorder_level || 0));
  const lowRows =
    lowStock.length > 0
      ? lowStock.slice(0, 8).map((m) =>
          `<li><strong>${m.name}</strong> — ${m.quantity_on_hand} ${m.unit} (reorder at ${m.reorder_level})</li>`
        ).join('')
      : '<li><em>No low-stock items</em></li>';

  const utilTableRows =
    utilRows.length > 0
      ? utilRows.sort((a, b) => b.util - a.util).slice(0, 5)
          .map((r) => `<tr><td>${r.name}</td><td>${r.assigned}</td><td>${r.cap}</td><td>${r.util}%</td></tr>`).join('')
      : '<tr><td colspan="4"><em>No resources yet</em></td></tr>';

  res.send(`
    <h1>PM Tool (SQLite)</h1>
    <p>
      ${me ? `Logged in as <strong>${me.name}</strong> (${me.role})
        <form method="POST" action="/logout" style="display:inline;margin-left:8px;">
          <button type="submit">Logout</button>
        </form>` : `<a href="/login">Login</a>`}
    </p>

    <h3>Dashboard</h3>
    <ul>
      <li>Total Projects: <strong>${totalProjects}</strong></li>
      <li>Total Employees: <strong>${totalEmployees}</strong></li>
      <li>Total Tasks: <strong>${totalTasks}</strong></li>
      <li>Total Resources: <strong>${totalResources}</strong></li>
      <li>Total Materials: <strong>${totalMaterials}</strong></li>
    </ul>

    <div style="display:flex; gap:24px; flex-wrap:wrap;">
      <div style="max-width:520px;">
        <h4>Tasks by Status</h4>
        <canvas id="statusChart" width="520" height="260"></canvas>
      </div>
      <div style="max-width:520px;">
        <h4>Resource Utilization</h4>
        <canvas id="utilChart" width="520" height="260"></canvas>
      </div>
    </div>

    <div style="margin-top:12px;">
      <h4>Top Resource Utilization</h4>
      <table border="1" cellpadding="6" cellspacing="0">
        <thead><tr><th>Resource</th><th>Assigned Hrs</th><th>Capacity/Wk</th><th>Util%</th></tr></thead>
        <tbody>${utilTableRows}</tbody>
      </table>
    </div>

    <div style="margin-top:12px;">
      <h4>Low-stock Materials</h4>
      <ul>${lowRows}</ul>
      <p><a href="/materials-page">View Materials</a> | <a href="/materials/tx/new">Record Stock Movement</a></p>
    </div>

    <hr/>
    <h3>Projects</h3>
    <ul>
      <li><a href="/projects-page">Projects Table</a></li>
      <li><a href="/projects/new">Add Project</a></li>
    </ul>

    <h3>Employees</h3>
    <ul>
      <li><a href="/employees-page">Employees Table</a></li>
      <li><a href="/employees/new">Add Employee</a></li>
    </ul>

    <h3>Tasks / WBS</h3>
    <ul>
      <li><a href="/tasks-page">All Tasks Table</a></li>
      <li><a href="/tasks/new">Add Task</a></li>
    </ul>

    <h3>Resources</h3>
    <ul>
      <li><a href="/resources-page">Resources Table</a></li>
      <li><a href="/resources/new">Add Resource</a></li>
      <li><a href="/assignments/new">Assign Resource to Task</a></li>
      <li><a href="/assignments-page">Assignments Table</a></li>
    </ul>

    <h3>Materials</h3>
    <ul>
      <li><a href="/materials-page">Materials Table</a></li>
      <li><a href="/materials/new">Add Material</a></li>
      <li><a href="/materials/tx/new">Record Stock Movement</a></li>
      <li><a href="/materials/transactions-page">Transactions</a></li>
    </ul>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      new Chart(document.getElementById('statusChart'), {
        type: 'pie',
        data: {
          labels: ${JSON.stringify(statusLabels)},
          datasets: [{ data: ${JSON.stringify(statusValues)}, backgroundColor: ['#007bff','#ffc107','#dc3545','#28a745'] }]
        }
      });
      new Chart(document.getElementById('utilChart'), {
        type: 'bar',
        data: { labels: ${JSON.stringify(utilLabels)}, datasets: [{ label: 'Utilization %', data: ${JSON.stringify(utilValues)} }] },
        options: { scales: { y: { min: 0, max: 100 } } }
      });
    </script>
  `);
});

/* Full Dashboard (simple) */
router.get('/dashboard', async (req, res) => {
  const [totalProjects, totalEmployees, totalTasks, totalResources, totalMaterials] = await Promise.all([
    Project.count(), Employee.count(), Task.count(), Resource.count(), Material.count()
  ]);

  const taskStatusCounts = await Task.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
    group: ['status'],
  });
  const statusLabels = taskStatusCounts.map((t) => t.status || 'unknown');
  const statusValues = taskStatusCounts.map((t) => Number(t.dataValues.count));

  const resources = await Resource.findAll({ include: [{ model: Assignment, as: 'assignments' }] });
  const utilLabels = resources.map((r) => r.name);
  const utilValues = resources.map((r) => {
    const assigned = (r.assignments || []).reduce((s, a) => s + Number(a.hours || 0), 0);
    const cap = Number(r.capacity_hours_per_week || 0);
    return cap > 0 ? Math.min(100, Math.round((assigned / cap) * 100)) : 0;
  });

  const materials = await Material.findAll();
  const lowStock = materials.filter((m) => Number(m.quantity_on_hand || 0) <= Number(m.reorder_level || 0));
  const lowList = lowStock.map((m) => `${m.name} (${m.quantity_on_hand}/${m.reorder_level})`).join(', ') || 'None';

  res.send(`
    <h1>Dashboard</h1>
    <p><a href="/">Home</a></p>
    <ul>
      <li>Total Projects: ${totalProjects}</li>
      <li>Total Employees: ${totalEmployees}</li>
      <li>Total Tasks: ${totalTasks}</li>
      <li>Total Resources: ${totalResources}</li>
      <li>Total Materials: ${totalMaterials}</li>
      <li><strong>Low-stock:</strong> ${lowList}</li>
    </ul>
    <div style="max-width:520px;"><canvas id="statusChart" width="520" height="260"></canvas></div>
    <div style="max-width:520px;"><canvas id="utilChart" width="520" height="260"></canvas></div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      new Chart(document.getElementById('statusChart'), { type: 'pie', data: { labels: ${JSON.stringify(statusLabels)}, datasets: [{ data: ${JSON.stringify(statusValues)} }] } });
      new Chart(document.getElementById('utilChart'), { type: 'bar', data: { labels: ${JSON.stringify(utilLabels)}, datasets: [{ data: ${JSON.stringify(utilValues)}, label: 'Utilization %' }] }, options: { scales: { y: { min: 0, max: 100 } } } });
    </script>
  `);
});

module.exports = router;
