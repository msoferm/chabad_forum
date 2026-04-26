const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
    } else {
      pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'chabad_forum',
        user: process.env.DB_USER || 'forum_user',
        password: process.env.DB_PASSWORD || 'forum_secret_2024',
        max: 20
      });
    }
  }
  return pool;
}

module.exports = { query: (text, params) => getPool().query(text, params), get pool() { return getPool(); } };
