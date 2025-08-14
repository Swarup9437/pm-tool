// src/routes/employees.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { Employee } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Protect create/edit/delete
router.use(['/employees/new','/employees', '/employees/:id/edit', '/employees/:id/delete'], requireAuth);

router.get('/employees', async (req, res) => res.json(await Employee.findAll()));

router.get('/employees-page', async (req, res) => {
  const list = await Employee.findAll();
  const rows = list.map(e => `
      <tr>
        <td>${e.id}</td><td>${e.name}</td><td>${e.email}</td><td>${e.role}</td><td>${e.phone || ''}</td>
        <td>
          <a href="/employees/${e.id}/edit">Edit</a>
          <form method="POST" action="/employees/${e.id}/delete" style="display:inline" onsubmit="return confirm('Delete this employee?');">
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
  `).join('');
  res.send(`
    <h2>Employees</h2>
    <p><a href="/">Home</a> | <a href="/employees/new">Add Employee</a></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});

router.get('/employees/new', (req, res) => {
  res.send(`
    <h2>Add Employee</h2>
    <p><a href="/">Home</a> | <a href="/employees-page">Back</a></p>
    <form method="POST" action="/employees">
      <div><label>Name: <input name="name" required></label></div>
      <div><label>Email: <input name="email" type="email" required></label></div>
      <div><label>Role:
        <select name="role" required>
          <option value="admin">Admin</option>
          <option value="pm">Project Manager</option>
          <option value="engineer">Engineer</option>
          <option value="viewer">Viewer</option>
        </select>
      </label></div>
      <div><label>Phone: <input name="phone"></label></div>
      <div><label>Temp Password: <input name="password" type="password" placeholder="optional"></label></div>
      <button type="submit">Save</button>
    </form>
  `);
});

router.post('/employees', async (req, res) => {
  try {
    const payload = { name: req.body.name, email: req.body.email, role: req.body.role, phone: req.body.phone };
    if (req.body.password) payload.password_hash = await bcrypt.hash(req.body.password, 10);
    await Employee.create(payload);
    res.redirect('/employees-page');
  } catch (err) {
    res.status(400).send('Error: ' + err.message);
  }
});

router.get('/employees/:id/edit', async (req, res) => {
  const e = await Employee.findByPk(req.params.id);
  if (!e) return res.status(404).send('Employee not found');
  res.send(`
    <h2>Edit Employee</h2>
    <p><a href="/employees-page">Back</a></p>
    <form method="POST" action="/employees/${e.id}/edit">
      <div><label>Name: <input name="name" value="${e.name}" required></label></div>
      <div><label>Email: <input name="email" type="email" value="${e.email}" required></label></div>
      <div><label>Role:
        <select name="role" required>
          ${['admin','pm','engineer','viewer'].map(r => `<option value="${r}" ${e.role===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </label></div>
      <div><label>Phone: <input name="phone" value="${e.phone || ''}"></label></div>
      <div><label>New Temp Password: <input name="password" type="password" placeholder="leave blank to keep"></label></div>
      <button type="submit">Save Changes</button>
    </form>
  `);
});

router.post('/employees/:id/edit', async (req, res) => {
  const e = await Employee.findByPk(req.params.id);
  if (!e) return res.status(404).send('Employee not found');
  const update = { name: req.body.name, email: req.body.email, role: req.body.role, phone: req.body.phone };
  if (req.body.password) update.password_hash = await bcrypt.hash(req.body.password, 10);
  await e.update(update);
  res.redirect('/employees-page');
});

router.post('/employees/:id/delete', async (req, res) => {
  const e = await Employee.findByPk(req.params.id);
  if (!e) return res.status(404).send('Employee not found');
  await e.destroy();
  res.redirect('/employees-page');
});

module.exports = router;
