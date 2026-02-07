const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('TABLES IN DB:');
    res.rows.forEach((row) => console.log('- ' + row.table_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTables();
