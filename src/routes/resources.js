// src/routes/resources.js
const express = require('express');
const { Resource } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(['/resources/new','/resources', '/resources/:id/edit', '/resources/:id/delete'], requireAuth);

router.get('/resources', async (req, res) => res.json(await Resource.findAll()));

router.get('/resources-page', async (req, res) => {
  const list = await Resource.findAll();
  const rows = list.map(r => `
    <tr>
      <td>${r.id}</td><td>${r.name}</td><td>${r.type}</td><td>${Number(r.rate).toLocaleString()}</td>
      <td>${r.capacity_hours_per_week}</td><td>${r.is_active ? 'Yes' : 'No'}</td>
      <td>
        <a href="/resources/${r.id}/edit">Edit</a>
        <form method="POST" action="/resources/${r.id}/delete" style="display:inline" onsubmit="return confirm('Delete this resource?');">
          <button type="submit">Delete</button>
        </form>
      </td>
    </tr>`).join('');
  res.send(`
    <h2>Resources</h2>
    <p><a href="/">Home</a> | <a href="/resources/new">Add Resource</a></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Rate</th><th>Capacity/Wk</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});

router.get('/resources/new', (req, res) => {
  res.send(`
    <h2>Add Resource</h2>
    <p><a href="/">Home</a> | <a href="/resources-page">Back</a></p>
    <form method="POST" action="/resources">
      <div><label>Name: <input name="name" required></label></div>
      <div><label>Type:
        <select name="type" required>
          <option value="labor">Labor</option>
          <option value="equipment">Equipment</option>
        </select>
      </label></div>
      <div><label>Rate: <input name="rate" type="number" step="0.01" value="0"></label></div>
      <div><label>Capacity Hours/Week: <input name="capacity_hours_per_week" type="number" value="40"></label></div>
      <div><label>Active: <input name="is_active" type="checkbox" checked></label></div>
      <button type="submit">Save</button>
    </form>
  `);
});

router.post('/resources', async (req, res) => {
  try {
    await Resource.create({
      name: req.body.name,
      type: req.body.type || 'labor',
      rate: Number(req.body.rate || 0),
      capacity_hours_per_week: Number(req.body.capacity_hours_per_week || 0),
      is_active: !!req.body.is_active,
    });
    res.redirect('/resources-page');
  } catch (err) {
    res.status(400).send('Error: ' + err.message);
  }
});

router.get('/resources/:id/edit', async (req, res) => {
  const r = await Resource.findByPk(req.params.id);
  if (!r) return res.status(404).send('Resource not found');
  res.send(`
    <h2>Edit Resource</h2>
    <p><a href="/resources-page">Back</a></p>
    <form method="POST" action="/resources/${r.id}/edit">
      <div><label>Name: <input name="name" value="${r.name}" required></label></div>
      <div><label>Type:
        <select name="type" required>
          <option value="labor" ${r.type==='labor'?'selected':''}>Labor</option>
          <option value="equipment" ${r.type==='equipment'?'selected':''}>Equipment</option>
        </select>
      </label></div>
      <div><label>Rate: <input name="rate" type="number" step="0.01" value="${r.rate || 0}"></label></div>
      <div><label>Capacity Hours/Week: <input name="capacity_hours_per_week" type="number" value="${r.capacity_hours_per_week || 0}"></label></div>
      <div><label>Active: <input name="is_active" type="checkbox" ${r.is_active ? 'checked' : ''}></label></div>
      <button type="submit">Save Changes</button>
    </form>
  `);
});

router.post('/resources/:id/edit', async (req, res) => {
  const r = await Resource.findByPk(req.params.id);
  if (!r) return res.status(404).send('Resource not found');
  await r.update({
    name: req.body.name,
    type: req.body.type || 'labor',
    rate: Number(req.body.rate || 0),
    capacity_hours_per_week: Number(req.body.capacity_hours_per_week || 0),
    is_active: !!req.body.is_active,
  });
  res.redirect('/resources-page');
});

router.post('/resources/:id/delete', async (req, res) => {
  const r = await Resource.findByPk(req.params.id);
  if (!r) return res.status(404).send('Resource not found');
  await r.destroy();
  res.redirect('/resources-page');
});

module.exports = router;
