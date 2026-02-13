const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const checkSchema = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, column_default, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'status';
    `);
    console.log('Status Column Schema:', res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

checkSchema();
