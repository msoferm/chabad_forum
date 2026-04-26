const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware');

// ── Dashboard Stats ──
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [users, threads, posts, cats] = await Promise.all([
      db.query('SELECT COUNT(*) total, COUNT(*) FILTER (WHERE last_seen > NOW()-INTERVAL \'7 days\') active_week FROM users'),
      db.query('SELECT COUNT(*) total FROM threads'),
      db.query('SELECT COUNT(*) total FROM posts'),
      db.query('SELECT COUNT(*) total FROM categories WHERE parent_id IS NULL')
    ]);
    res.json({ users: users.rows[0], threads: threads.rows[0], posts: posts.rows[0], categories: cats.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Categories CRUD ──
router.get('/categories', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/categories', auth, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, icon, color, sort_order, parent_id, is_visible } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name,slug,description,icon,color,sort_order,parent_id,is_visible) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, slug, description || '', icon || '📁', color || '#3b82f6', sort_order || 0, parent_id || null, is_visible !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/categories/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, icon, color, sort_order, parent_id, is_visible } = req.body;
    const result = await db.query(
      'UPDATE categories SET name=$1,slug=$2,description=$3,icon=$4,color=$5,sort_order=$6,parent_id=$7,is_visible=$8 WHERE id=$9 RETURNING *',
      [name, slug, description, icon, color, sort_order, parent_id || null, is_visible, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/categories/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ message: 'נמחק' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Users Management ──
const bcrypt = require('bcryptjs');

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, password, display_name, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'חסרים שדות חובה' });
    if (password.length < 6) return res.status(400).json({ error: 'סיסמה חייבת להיות לפחות 6 תווים' });
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, display_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING id,username,email,display_name,role',
      [username.trim(), email.trim().toLowerCase(), hash, display_name || username, role || 'user']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'שם משתמש או אימייל כבר קיימים' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT id,username,email,display_name,role,post_count,is_banned,created_at,last_seen FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('UPDATE users SET role=$1 WHERE id=$2 RETURNING id,username,role', [req.body.role, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/users/:id/ban', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('UPDATE users SET is_banned=$1 WHERE id=$2 RETURNING id,username,is_banned', [req.body.is_banned, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Threads Management ──
router.get('/threads', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, u.username as author, c.name as category_name FROM threads t
      LEFT JOIN users u ON t.user_id=u.id LEFT JOIN categories c ON t.category_id=c.id
      ORDER BY t.created_at DESC LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/threads/:id', auth, adminOnly, async (req, res) => {
  try {
    const { is_pinned, is_locked, is_visible, category_id, title } = req.body;
    const result = await db.query(
      'UPDATE threads SET is_pinned=COALESCE($1,is_pinned), is_locked=COALESCE($2,is_locked), is_visible=COALESCE($3,is_visible), category_id=COALESCE($4,category_id), title=COALESCE($5,title) WHERE id=$6 RETURNING *',
      [is_pinned, is_locked, is_visible, category_id, title, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/threads/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM threads WHERE id=$1', [req.params.id]);
    res.json({ message: 'נמחק' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Pages CRUD ──
router.get('/pages', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pages ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pages', auth, adminOnly, async (req, res) => {
  try {
    const { slug, title, content, is_published, sort_order } = req.body;
    const result = await db.query('INSERT INTO pages (slug,title,content,is_published,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *', [slug, title, content || '', is_published !== false, sort_order || 0]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pages/:id', auth, adminOnly, async (req, res) => {
  try {
    const { slug, title, content, is_published, sort_order } = req.body;
    const result = await db.query('UPDATE pages SET slug=$1,title=$2,content=$3,is_published=$4,sort_order=$5 WHERE id=$6 RETURNING *', [slug, title, content, is_published, sort_order, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/pages/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM pages WHERE id=$1', [req.params.id]);
    res.json({ message: 'נמחק' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Site Settings ──
router.get('/settings', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM site_settings');
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/settings', auth, adminOnly, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await db.query('INSERT INTO site_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()', [key, value]);
    }
    res.json({ message: 'הגדרות עודכנו' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Announcements ──
router.get('/announcements', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/announcements', auth, adminOnly, async (req, res) => {
  try {
    const result = await db.query('INSERT INTO announcements (title,content,is_active) VALUES ($1,$2,$3) RETURNING *', [req.body.title, req.body.content, req.body.is_active !== false]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/announcements/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
    res.json({ message: 'נמחק' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
