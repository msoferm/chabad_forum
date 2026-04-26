const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');
function sanitize(s) { return s ? s.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*on\w+="[^"]*"/gi, '').trim() : ''; }

// Get posts for a thread
router.get('/', async (req, res) => {
  try {
    const { thread_id, page = 1, limit = 20 } = req.query;
    if (!thread_id) return res.status(400).json({ error: 'חסר thread_id' });
    const offset = (page - 1) * limit;
    const result = await db.query(`
      SELECT p.*, u.username, u.display_name, u.avatar_url, u.role as user_role, u.post_count as user_post_count, u.reputation as user_reputation, u.created_at as user_joined
      FROM posts p LEFT JOIN users u ON p.user_id=u.id
      WHERE p.thread_id=$1 AND p.is_visible=true
      ORDER BY p.is_first_post DESC, p.created_at ASC
      LIMIT $2 OFFSET $3
    `, [thread_id, limit, offset]);
    const count = await db.query('SELECT COUNT(*) FROM posts WHERE thread_id=$1 AND is_visible=true', [thread_id]);
    res.json({ posts: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create post (reply)
router.post('/', auth, async (req, res) => {
  try {
    const { thread_id } = req.body;
    const content = sanitize(req.body.content);
    if (!thread_id || !content) return res.status(400).json({ error: 'חסרים שדות' });

    // Check thread exists and not locked
    const thread = await db.query('SELECT * FROM threads WHERE id=$1', [thread_id]);
    if (thread.rows.length === 0) return res.status(404).json({ error: 'אשכול לא נמצא' });
    if (thread.rows[0].is_locked) return res.status(403).json({ error: 'האשכול נעול' });

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const post = await client.query('INSERT INTO posts (thread_id, user_id, content) VALUES ($1,$2,$3) RETURNING *', [thread_id, req.user.id, content]);
      await client.query('UPDATE threads SET reply_count=reply_count+1, last_post_user_id=$1, last_post_at=NOW() WHERE id=$2', [req.user.id, thread_id]);
      await client.query('UPDATE users SET post_count=post_count+1 WHERE id=$1', [req.user.id]);
      await client.query('COMMIT');
      res.status(201).json(post.rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Like a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const existing = await db.query('SELECT * FROM likes WHERE user_id=$1 AND post_id=$2', [req.user.id, req.params.id]);
    if (existing.rows.length > 0) {
      await db.query('DELETE FROM likes WHERE user_id=$1 AND post_id=$2', [req.user.id, req.params.id]);
      await db.query('UPDATE posts SET like_count=like_count-1 WHERE id=$1', [req.params.id]);
      return res.json({ liked: false });
    }
    await db.query('INSERT INTO likes (user_id, post_id) VALUES ($1,$2)', [req.user.id, req.params.id]);
    await db.query('UPDATE posts SET like_count=like_count+1 WHERE id=$1', [req.params.id]);
    res.json({ liked: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Edit post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await db.query('SELECT * FROM posts WHERE id=$1', [req.params.id]);
    if (post.rows.length === 0) return res.status(404).json({ error: 'הודעה לא נמצאה' });
    if (post.rows[0].user_id !== req.user.id && req.user.role === 'user') return res.status(403).json({ error: 'אין הרשאה' });
    const result = await db.query('UPDATE posts SET content=$1, edited_at=NOW() WHERE id=$2 RETURNING *', [req.body.content, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
