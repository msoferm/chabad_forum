const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'נדרשת הזדהות' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'chabad_forum_jwt_secret_2024');
    next();
  } catch { return res.status(401).json({ error: 'טוקן לא תקין' }); }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'אין הרשאת מנהל' });
  next();
}

module.exports = { auth, adminOnly };
