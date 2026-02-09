const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks';
    `);
    console.log(
      'Tasks table columns:',
      res.rows.map((r) => r.column_name)
    );
    client.release();
    pool.end();
  } catch (err) {
    console.error(err);
  }
}
run();
