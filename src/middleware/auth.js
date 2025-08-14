// src/middleware/auth.js
const { Employee } = require('../models');

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
}

async function currentUser(req) {
  if (!req.session || !req.session.userId) return null;
  return await Employee.findByPk(req.session.userId);
}

module.exports = { requireAuth, currentUser };
