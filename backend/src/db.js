const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5436,
  database: process.env.DB_NAME || 'chabad_forum',
  user: process.env.DB_USER || 'forum_user',
  password: process.env.DB_PASSWORD || 'forum_secret_2024'
});
module.exports = { query: (text, params) => pool.query(text, params), pool };
