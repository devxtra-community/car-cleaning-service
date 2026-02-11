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
      SELECT column_name, column_default, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'status';
    `);
    console.log('Status column details:', res.rows);
    client.release();
    pool.end();
  } catch (err) {
    console.error(err);
  }
}
run();
