// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { Employee } = require('../models');

const router = express.Router();

// Login form
router.get('/login', (req, res) => {
  res.send(`
    <h2>Login</h2>
    <form method="POST" action="/login">
      <div><label>Email: <input name="email" type="email" required></label></div>
      <div><label>Password: <input name="password" type="password" required></label></div>
      <button type="submit">Sign in</button>
    </form>
    <p><a href="/">Back</a></p>
  `);
});

// Login submit
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Employee.findOne({ where: { email } });
  if (!user || !user.password_hash) return res.status(401).send('Invalid credentials. <a href="/login">Try again</a>');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).send('Invalid credentials. <a href="/login">Try again</a>');
  req.session.userId = user.id;
  res.redirect('/');
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
