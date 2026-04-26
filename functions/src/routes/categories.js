const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM threads t WHERE t.category_id = c.id AND t.is_visible) as thread_count,
        (SELECT COUNT(*) FROM posts p JOIN threads t ON p.thread_id=t.id WHERE t.category_id=c.id) as post_count
      FROM categories c WHERE c.is_visible=true ORDER BY c.sort_order ASC
    `);
    // Organize into parent/children
    const cats = result.rows;
    const parents = cats.filter(c => !c.parent_id);
    const grouped = parents.map(p => ({
      ...p,
      children: cats.filter(c => c.parent_id === p.id)
    }));
    res.json(grouped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const cat = await db.query('SELECT * FROM categories WHERE slug=$1', [req.params.slug]);
    if (cat.rows.length === 0) return res.status(404).json({ error: 'קטגוריה לא נמצאה' });
    res.json(cat.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
