const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function inspect() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
    console.log('JSON_START' + JSON.stringify(res.rows.map((r) => r.column_name)) + 'JSON_END');
  } catch (err) {
    console.error('Error inspecting database:', err);
  } finally {
    await pool.end();
  }
}

inspect();
