const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');
function sanitize(s) { return s ? s.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*on\w+="[^"]*"/gi, '').trim() : ''; }

// List threads (by category or latest)
router.get('/', async (req, res) => {
  try {
    const { category_id, category_slug, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    let where = 't.is_visible = true';
    const params = [];

    if (category_slug) {
      params.push(category_slug);
      where += ` AND c.slug = $${params.length}`;
    } else if (category_id) {
      params.push(category_id);
      where += ` AND t.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (t.title ILIKE $${params.length} OR p_first.content ILIKE $${params.length})`;
    }

    params.push(limit, offset);
    const result = await db.query(`
      SELECT t.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
        u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar,
        lu.username as last_post_username, lu.display_name as last_post_display_name,
        (SELECT content FROM posts WHERE thread_id=t.id AND is_first_post=true LIMIT 1) as first_post_preview
      FROM threads t
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users lu ON t.last_post_user_id = lu.id
      LEFT JOIN posts p_first ON p_first.thread_id = t.id AND p_first.is_first_post = true
      WHERE ${where}
      ORDER BY t.is_pinned DESC, t.last_post_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    // Count total
    const countParams = params.slice(0, -2);
    const countResult = await db.query(`
      SELECT COUNT(*) FROM threads t JOIN categories c ON t.category_id=c.id
      LEFT JOIN posts p_first ON p_first.thread_id=t.id AND p_first.is_first_post=true
      WHERE ${where}
    `, countParams);

    res.json({ threads: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single thread
router.get('/:id', async (req, res) => {
  try {
    await db.query('UPDATE threads SET view_count = view_count + 1 WHERE id=$1', [req.params.id]);
    const result = await db.query(`
      SELECT t.*, c.name as category_name, c.slug as category_slug,
        u.username as author_username, u.display_name as author_display_name
      FROM threads t JOIN categories c ON t.category_id=c.id LEFT JOIN users u ON t.user_id=u.id
      WHERE t.id=$1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'אשכול לא נמצא' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create thread
router.post('/', auth, async (req, res) => {
  try {
    const { category_id } = req.body;
    const title = sanitize(req.body.title);
    const content = sanitize(req.body.content);
    if (!title || !content) return res.status(400).json({ error: 'חסרים שדות' });
    if (title.length > 500) return res.status(400).json({ error: 'כותרת ארוכה מדי' });
    const slug = title.replace(/\s+/g, '-').replace(/[^\u0590-\u05FFa-zA-Z0-9-]/g, '').slice(0, 100);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const thread = await client.query(
        'INSERT INTO threads (category_id, user_id, title, slug, last_post_user_id) VALUES ($1,$2,$3,$4,$2) RETURNING *',
        [category_id, req.user.id, title, slug]
      );
      await client.query(
        'INSERT INTO posts (thread_id, user_id, content, is_first_post) VALUES ($1,$2,$3,true)',
        [thread.rows[0].id, req.user.id, content]
      );
      await client.query('UPDATE users SET thread_count=thread_count+1, post_count=post_count+1 WHERE id=$1', [req.user.id]);
      await client.query('COMMIT');
      res.status(201).json(thread.rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
