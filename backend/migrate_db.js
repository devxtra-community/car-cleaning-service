const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrate() {
  try {
    console.log('Adding task_amount column to tasks table...');
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS task_amount DECIMAL(10, 2) DEFAULT 0;
    `);
    console.log('Success!');
  } catch (err) {
    console.error('Error migrating database:', err);
  } finally {
    await pool.end();
  }
}

migrate();
