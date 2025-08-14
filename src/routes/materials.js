// src/routes/materials.js
const express = require('express');
const { Material, MaterialTransaction } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use([
  '/materials/new','/materials',
  '/materials/:id/edit','/materials/:id/delete',
  '/materials/tx/new','/materials/tx'
], requireAuth);

router.get('/materials', async (req, res) => res.json(await Material.findAll()));

router.get('/materials-page', async (req, res) => {
  const list = await Material.findAll();
  const rows = list.map(m => `
    <tr>
      <td>${m.id}</td><td>${m.name}</td><td>${m.unit}</td>
      <td>${Number(m.unit_cost).toLocaleString()}</td>
      <td>${Number(m.quantity_on_hand)}</td>
      <td>${Number(m.reorder_level)}</td>
      <td>${Number(m.quantity_on_hand) <= Number(m.reorder_level) ? '<span style="color:red;">LOW</span>' : 'OK'}</td>
      <td>
        <a href="/materials/${m.id}/edit">Edit</a>
        <form method="POST" action="/materials/${m.id}/delete" style="display:inline" onsubmit="return confirm('Delete this material?');">
          <button type="submit">Delete</button>
        </form>
        <a href="/materials/tx/new?material=${m.id}" style="margin-left:8px;">Record Movement</a>
      </td>
    </tr>`).join('');
  res.send(`
    <h2>Materials</h2>
    <p>
      <a href="/">Home</a> |
      <a href="/materials/new">Add Material</a> |
      <a href="/materials/tx/new">Record Movement</a> |
      <a href="/materials/transactions-page">Transactions</a>
    </p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>ID</th><th>Name</th><th>Unit</th><th>Unit Cost</th><th>On Hand</th><th>Reorder</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});

router.get('/materials/new', (req, res) => {
  res.send(`
    <h2>Add Material</h2>
    <p><a href="/materials-page">Back</a></p>
    <form method="POST" action="/materials">
      <div><label>Name: <input name="name" required></label></div>
      <div><label>Unit: <input name="unit" value="unit"></label></div>
      <div><label>Unit Cost: <input name="unit_cost" type="number" step="0.01" value="0"></label></div>
      <div><label>Quantity on Hand: <input name="quantity_on_hand" type="number" step="0.01" value="0"></label></div>
      <div><label>Reorder Level: <input name="reorder_level" type="number" step="0.01" value="0"></label></div>
      <div><label>Active: <input name="is_active" type="checkbox" checked></label></div>
      <button type="submit">Save</button>
    </form>
  `);
});

router.post('/materials', async (req, res) => {
  try {
    await Material.create({
      name: req.body.name,
      unit: req.body.unit || 'unit',
      unit_cost: Number(req.body.unit_cost || 0),
      quantity_on_hand: Number(req.body.quantity_on_hand || 0),
      reorder_level: Number(req.body.reorder_level || 0),
      is_active: !!req.body.is_active,
    });
    res.redirect('/materials-page');
  } catch (err) {
    res.status(400).send('Error: ' + err.message);
  }
});

// Edit material form
router.get('/materials/:id/edit', async (req, res) => {
  const m = await Material.findByPk(req.params.id);
  if (!m) return res.status(404).send('Material not found');
  res.send(`
    <h2>Edit Material</h2>
    <p><a href="/materials-page">Back</a></p>
    <form method="POST" action="/materials/${m.id}/edit">
      <div><label>Name: <input name="name" value="${m.name}" required></label></div>
      <div><label>Unit: <input name="unit" value="${m.unit || 'unit'}"></label></div>
      <div><label>Unit Cost: <input name="unit_cost" type="number" step="0.01" value="${m.unit_cost || 0}"></label></div>
      <div><label>Quantity on Hand: <input name="quantity_on_hand" type="number" step="0.01" value="${m.quantity_on_hand || 0}"></label></div>
      <div><label>Reorder Level: <input name="reorder_level" type="number" step="0.01" value="${m.reorder_level || 0}"></label></div>
      <div><label>Active: <input name="is_active" type="checkbox" ${m.is_active ? 'checked' : ''}></label></div>
      <button type="submit">Save Changes</button>
    </form>
  `);
});

router.post('/materials/:id/edit', async (req, res) => {
  const m = await Material.findByPk(req.params.id);
  if (!m) return res.status(404).send('Material not found');
  await m.update({
    name: req.body.name,
    unit: req.body.unit || 'unit',
    unit_cost: Number(req.body.unit_cost || 0),
    quantity_on_hand: Number(req.body.quantity_on_hand || 0),
    reorder_level: Number(req.body.reorder_level || 0),
    is_active: !!req.body.is_active,
  });
  res.redirect('/materials-page');
});

// Delete material
router.post('/materials/:id/delete', async (req, res) => {
  const m = await Material.findByPk(req.params.id);
  if (!m) return res.status(404).send('Material not found');
  await m.destroy();
  res.redirect('/materials-page');
});

// Record stock movement (form)
router.get('/materials/tx/new', async (req, res) => {
  const materials = await Material.findAll();
  const options = materials.map(m =>
    `<option value="${m.id}" ${req.query.material == m.id ? 'selected' : ''}>${m.name}</option>`
  ).join('');
  res.send(`
    <h2>Record Stock Movement</h2>
    <p><a href="/materials-page">Back</a></p>
    <form method="POST" action="/materials/tx">
      <div><label>Material: <select name="material_id" required>${options}</select></label></div>
      <div><label>Type:
        <select name="type" required>
          <option value="receive">Receive (add)</option>
          <option value="consume">Consume (subtract)</option>
          <option value="adjust">Adjust (add/subtract)</option>
        </select>
      </label></div>
      <div><label>Quantity: <input name="quantity" type="number" step="0.01" value="1" required></label></div>
      <div><label>Date: <input name="date" type="date" value="${new Date().toISOString().slice(0,10)}"></label></div>
      <div><label>Note: <input name="note" placeholder="optional"></label></div>
      <button type="submit">Save</button>
    </form>
  `);
});

// Record stock movement (save)
router.post('/materials/tx', async (req, res) => {
  try {
    const { material_id, type, quantity, date, note } = req.body;
    const mat = await Material.findByPk(material_id);
    if (!mat) return res.status(404).send('Material not found');

    const qty = Number(quantity || 0);
    if (!['receive', 'consume', 'adjust'].includes(type)) return res.status(400).send('Invalid type');
    if (qty === 0) return res.status(400).send('Quantity cannot be 0');

    await MaterialTransaction.create({
      material_id: mat.id, type, quantity: qty, date: date || new Date().toISOString().slice(0,10), note: note || '',
    });

    let newQ = Number(mat.quantity_on_hand || 0);
    if (type === 'receive') newQ += qty;
    else if (type === 'consume') newQ -= qty;
    else if (type === 'adjust') newQ += qty; // qty can be +/- if you pass negative here
    await mat.update({ quantity_on_hand: newQ });

    res.redirect('/materials-page');
  } catch (err) {
    res.status(400).send('Error: ' + err.message);
  }
});

// Transactions page
router.get('/materials/transactions-page', async (req, res) => {
  const txs = await MaterialTransaction.findAll({ include: [{ model: Material }], order: [['createdAt','DESC']] });
  const rows = txs.map(t => `
    <tr>
      <td>${t.id}</td><td>${t.Material ? t.Material.name : ''}</td><td>${t.type}</td>
      <td>${t.quantity}</td><td>${t.date || ''}</td><td>${t.note || ''}</td>
    </tr>
  `).join('');
  res.send(`
    <h2>Material Transactions</h2>
    <p><a href="/">Home</a> | <a href="/materials/tx/new">Record Movement</a> | <a href="/materials-page">Materials</a></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>ID</th><th>Material</th><th>Type</th><th>Qty</th><th>Date</th><th>Note</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});

module.exports = router;
