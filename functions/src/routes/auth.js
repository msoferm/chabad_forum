const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, getSecret } = require('../middleware');

// Sanitize input - strip HTML/script tags
function sanitize(str) { return str ? str.replace(/<[^>]*>/g, '').trim() : ''; }

router.post('/register', async (req, res) => {
  try {
    const username = sanitize(req.body.username);
    const email = sanitize(req.body.email).toLowerCase();
    const password = req.body.password;
    const display_name = sanitize(req.body.display_name);
    if (!username || !email || !password) return res.status(400).json({ error: 'חסרים שדות' });
    if (password.length < 6) return res.status(400).json({ error: 'סיסמה חייבת להיות לפחות 6 תווים' });
    if (username.length < 2 || username.length > 50) return res.status(400).json({ error: 'שם משתמש חייב להיות בין 2-50 תווים' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'אימייל לא תקין' });
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, display_name) VALUES ($1,$2,$3,$4) RETURNING id, username, email, display_name, role',
      [username, email, hash, display_name || username]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getSecret(), { expiresIn: '30d' });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'שם משתמש או אימייל כבר קיימים' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE username=$1 OR email=$1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    const user = result.rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'המשתמש חסום' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    await db.query('UPDATE users SET last_seen=NOW() WHERE id=$1', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getSecret(), { expiresIn: '30d' });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id,username,email,display_name,avatar_url,bio,role,post_count,thread_count,reputation,created_at FROM users WHERE id=$1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'משתמש לא נמצא' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
