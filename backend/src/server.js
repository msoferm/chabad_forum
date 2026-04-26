const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3001', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/threads', require('./routes/threads'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

// Public pages
app.get('/api/pages/:slug', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pages WHERE slug=$1 AND is_published=true', [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'עמוד לא נמצא' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public settings (no auth needed)
const db = require('./db');
app.get('/api/public/settings', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM site_settings WHERE key IN ('site_name','site_description','site_logo','footer_text','footer_links','primary_color','accent_color','welcome_message')");
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rate limiting - simple in-memory
const rateLimits = {};
app.use('/api/auth', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimits[ip]) rateLimits[ip] = [];
  rateLimits[ip] = rateLimits[ip].filter(t => now - t < 60000);
  if (rateLimits[ip].length >= 10) return res.status(429).json({ error: 'יותר מדי ניסיונות, נסה שוב בעוד דקה' });
  rateLimits[ip].push(now);
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, '0.0.0.0', () => console.log(`🕎 Chabad Forum Backend on port ${PORT}`));
module.exports = app;
