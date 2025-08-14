// src/server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const bcrypt = require('bcryptjs'); // used for admin seeding
const { sequelize, Employee } = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

/* ---------- Core middleware ---------- */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
}));

/* ---------- Mount Routers ---------- */
app.use(require('./routes/auth'));
app.use(require('./routes/dashboard'));
app.use(require('./routes/employees'));
app.use(require('./routes/projects'));
app.use(require('./routes/tasks'));
app.use(require('./routes/resources'));
app.use(require('./routes/assignments'));
app.use(require('./routes/materials'));
try { app.use(require('./routes/reports')); } catch (_) {}
app.use(require('./routes/dev'));

/* ---------- Basic 404 & error handler ---------- */
app.use((req, res) => res.status(404).send('Not Found'));
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong. ' + (process.env.NODE_ENV === 'development' ? err.message : ''));
});

/* ---------- Boot: sync (with SQLite FK handling) + ensure admin ---------- */
(async () => {
  const isSQLite = sequelize.getDialect() === 'sqlite';

  // Drop any *_backup tables left behind by prior alter attempts
  async function cleanupSQLiteAlterArtifacts() {
    if (!isSQLite) return;
    try {
      const [rows] = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup';"
      );
      for (const r of rows) {
        try {
          await sequelize.query(`DROP TABLE IF EXISTS "${r.name}";`);
          console.log('Dropped leftover table:', r.name);
        } catch (e) {
          console.warn('Could not drop', r.name, e.message);
        }
      }
    } catch (e) {
      console.warn('Cleanup query failed:', e.message);
    }
  }

  if (isSQLite) {
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    console.log('SQLite PRAGMA foreign_keys = OFF (pre‑alter)');
  }
  try {
    await cleanupSQLiteAlterArtifacts();
    // Use alter:true during development; switch to migrations in prod
    await sequelize.sync({ alter: true });
  } finally {
    if (isSQLite) {
      await sequelize.query('PRAGMA foreign_keys = ON;');
      console.log('SQLite PRAGMA foreign_keys = ON (post‑alter)');
    }
  }

  // Ensure an admin user exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  await Employee.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      name: 'System Admin',
      role: 'admin',
      password_hash: await bcrypt.hash(adminPass, 10),
    },
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
