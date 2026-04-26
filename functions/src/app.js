const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/threads', require('./routes/threads'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

// Public pages
const db = require('./db');
app.get('/api/pages/:slug', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pages WHERE slug=$1 AND is_published=true', [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'עמוד לא נמצא' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public settings
app.get('/api/public/settings', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM site_settings WHERE key IN ('site_name','site_description','site_logo','footer_text','footer_links','primary_color','accent_color','welcome_message')");
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
