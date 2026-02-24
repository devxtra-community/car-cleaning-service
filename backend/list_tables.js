const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkNullability() {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `);
    console.log('--- START ---');
    res.rows.forEach((r) => {
      console.log(`${r.column_name}: ${r.is_nullable}`);
    });
    console.log('--- END ---');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkNullability();
