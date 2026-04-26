const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:username', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id,username,display_name,avatar_url,bio,role,post_count,thread_count,reputation,last_seen,created_at FROM users WHERE username=$1',
      [req.params.username]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'משתמש לא נמצא' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:username/threads', async (req, res) => {
  try {
    const user = await db.query('SELECT id FROM users WHERE username=$1', [req.params.username]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'משתמש לא נמצא' });
    const result = await db.query(`
      SELECT t.*, c.name as category_name, c.slug as category_slug
      FROM threads t JOIN categories c ON t.category_id=c.id
      WHERE t.user_id=$1 AND t.is_visible=true ORDER BY t.created_at DESC LIMIT 20
    `, [user.rows[0].id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
