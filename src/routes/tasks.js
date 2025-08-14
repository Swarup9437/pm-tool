// src/routes/tasks.js
const express = require('express');
const { Task, Project, Employee } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(['/tasks/new','/tasks', '/tasks/:id/edit', '/tasks/:id/delete'], requireAuth);

router.get('/tasks', async (req, res) => {
  res.json(await Task.findAll({ include: [{ model: Project }, { model: Employee, as: 'owner' }] }));
});

router.get('/tasks-page', async (req, res) => {
  const list = await Task.findAll({ include: [{ model: Project }, { model: Employee, as: 'owner' }] });
  const rows = list.map(t => `
    <tr>
      <td>${t.id}</td>
      <td>${t.Project ? t.Project.code + ' — ' + t.Project.name : ''}</td>
      <td>${t.wbs || ''}</td>
      <td>${t.name}</td>
      <td>${t.owner ? t.owner.name : ''}</td>
      <td>${t.start || ''}</td>
      <td>${t.finish || ''}</td>
      <td>${t.percent_complete || 0}%</td>
      <td>${t.status || ''}</td>
      <td>
        <a href="/tasks/${t.id}/edit">Edit</a>
        <form method="POST" action="/tasks/${t.id}/delete" style="display:inline" onsubmit="return confirm('Delete this task?');">
          <button type="submit">Delete</button>
        </form>
      </td>
    </tr>
  `).join('');
  res.send(`
    <h2>All Tasks</h2>
    <p><a href="/">Home</a> | <a href="/tasks/new">Add Task</a></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>ID</th><th>Project</th><th>WBS</th><th>Name</th><th>Owner</th><th>Start</th><th>Finish</th><th>% Complete</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});

router.get('/tasks/new', async (req, res) => {
  const projects = await Project.findAll();
  const projectOptions = projects.map(p =>
    `<option value="${p.id}" ${req.query.project == p.id ? 'selected' : ''}>${p.code} — ${p.name}</option>`
  ).join('');
  const owners = await Employee.findAll();
  const ownerOptions = owners.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join('');
  res.send(`
    <h2>Add Task</h2>
    <p><a href="/">Home</a> | <a href="/tasks-page">Back</a></p>
    <form method="POST" action="/tasks">
      <div><label>Project: <select name="project_id" required>${projectOptions}</select></label></div>
      <div><label>WBS: <input name="wbs"></label></div>
      <div><label>Name: <input name="name" required></label></div>
      <div><label>Owner: <select name="owner_id" required>${ownerOptions}</select></label></div>
      <div><label>Start: <input name="start" type="date"></label></div>
      <div><label>Finish: <input name="finish" type="date"></label></div>
      <div><label>% Complete: <input name="percent_complete" type="number" min="0" max="100" value="0"></label></div>
      <div><label>Status:
        <select name="status">
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
      </label></div>
      <button type="submit">Save</button>
    </form>
  `);
});

router.post('/tasks', async (req, res) => {
  try {
    await Task.create(req.body);
    res.redirect('/tasks-page');
  } catch (err) {
    res.status(400).send('Error: ' + err.message);
  }
});

router.get('/tasks/:id/edit', async (req, res) => {
  const t = await Task.findByPk(req.params.id);
  if (!t) return res.status(404).send('Task not found');

  const projects = await Project.findAll();
  const projectOptions = projects.map(p =>
    `<option value="${p.id}" ${t.project_id == p.id ? 'selected' : ''}>${p.code} — ${p.name}</option>`
  ).join('');

  const owners = await Employee.findAll();
  const ownerOptions = owners.map(e =>
    `<option value="${e.id}" ${t.owner_id == e.id ? 'selected' : ''}>${e.name} (${e.role})</option>`
  ).join('');

  res.send(`
    <h2>Edit Task</h2>
    <p><a href="/tasks-page">Back</a></p>
    <form method="POST" action="/tasks/${t.id}/edit">
      <div><label>Project: <select name="project_id" required>${projectOptions}</select></label></div>
      <div><label>WBS: <input name="wbs" value="${t.wbs || ''}"></label></div>
      <div><label>Name: <input name="name" value="${t.name}" required></label></div>
      <div><label>Owner: <select name="owner_id" required>${ownerOptions}</select></label></div>
      <div><label>Start: <input name="start" type="date" value="${t.start || ''}"></label></div>
      <div><label>Finish: <input name="finish" type="date" value="${t.finish || ''}"></label></div>
      <div><label>% Complete: <input name="percent_complete" type="number" min="0" max="100" value="${t.percent_complete || 0}"></label></div>
      <div><label>Status:
        <select name="status">
          <option value="not_started" ${t.status==='not_started'?'selected':''}>Not started</option>
          <option value="in_progress" ${t.status==='in_progress'?'selected':''}>In progress</option>
          <option value="blocked" ${t.status==='blocked'?'selected':''}>Blocked</option>
          <option value="done" ${t.status==='done'?'selected':''}>Done</option>
        </select>
      </label></div>
      <button type="submit">Save Changes</button>
    </form>
  `);
});

router.post('/tasks/:id/edit', async (req, res) => {
  const t = await Task.findByPk(req.params.id);
  if (!t) return res.status(404).send('Task not found');
  await t.update({
    project_id: req.body.project_id,
    wbs: req.body.wbs,
    name: req.body.name,
    owner_id: req.body.owner_id,
    start: req.body.start || null,
    finish: req.body.finish || null,
    percent_complete: Number(req.body.percent_complete || 0),
    status: req.body.status
  });
  res.redirect('/tasks-page');
});

router.post('/tasks/:id/delete', async (req, res) => {
  const t = await Task.findByPk(req.params.id);
  if (!t) return res.status(404).send('Task not found');
  await t.destroy();
  res.redirect('/tasks-page');
});

module.exports = router;
