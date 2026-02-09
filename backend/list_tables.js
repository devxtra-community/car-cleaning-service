const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listColumns() {
  try {
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'penalties'
    `);
    console.log('Penalties columns:');
    columns.rows.forEach((col) => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listColumns();
