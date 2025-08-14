// src/routes/assignments.js
const express = require('express');
const { Assignment, Task, Project, Resource } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(['/assignments/new','/assignments'], requireAuth);

router.get('/assignments', async (req, res) => {
  const list = await Assignment.findAll({
    include: [{ model: Task, as: 'task', include: [Project] }, { model: Resource, as: 'resource' }],
  });
  res.json(list);
});

router.get('/assignments-page', async (req, res) => {
  const list = await Assignment.findAll({
    include: [{ model: Task, as: 'task', include: [Project] }, { model: Resource, as: 'resource' }],
  });

  const rows = list.map(a => {
    const proj = a.task?.Project;
    return `
      <tr>
        <td>${a.id}</td>
        <td>${proj ? proj.code : ''} ${proj ? '— ' + proj.name : ''}</td>
        <td>${a.task ? a.task.name : ''}</td>
        <td>${a.resource ? a.resource.name : ''}</td>
        <td>${a.hours}</td>
      </tr>`;
  }).join('');

  res.send(`
    <h2>Assignments</h2>
    <p><a href="/">Home</a> | <a href="/assignments/new">Assign Resource to Task</a></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>ID</th><th>Project</th><th>Task</th><th>Resource</th><th>Hours</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});

router.get('/assignments/new', async (req, res) => {
  const tasks = await Task.findAll({ include: [Project] });
  const taskOptions = tasks.map(t =>
    `<option value="${t.id}">${t.Project ? t.Project.code + ' — ' + t.Project.name : ''} — ${t.name}</option>`
  ).join('');
  const resources = await Resource.findAll();
  const resourceOptions = resources.map(r => `<option value="${r.id}">${r.name} (${r.type})</option>`).join('');

  res.send(`
    <h2>Assign Resource to Task</h2>
    <p><a href="/">Home</a> | <a href="/assignments-page">Back</a></p>
    <form method="POST" action="/assignments">
      <div><label>Task: <select name="task_id" required>${taskOptions}</select></label></div>
      <div><label>Resource: <select name="resource_id" required>${resourceOptions}</select></label></div>
      <div><label>Hours: <input name="hours" type="number" step="0.25" value="8"></label></div>
      <button type="submit">Save</button>
    </form>
  `);
});

router.post('/assignments', async (req, res) => {
  try {
    await Assignment.create({
      task_id: req.body.task_id,
      resource_id: req.body.resource_id,
      hours: Number(req.body.hours || 0),
    });
    res.redirect('/assignments-page');
  } catch (err) {
    res.status(400).send('Error: ' + err.message);
  }
});

module.exports = router;
