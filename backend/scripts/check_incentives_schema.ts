import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const checkTable = async () => {
  const client = await pool.connect();
  try {
    console.log('Checking cleaner_incentives schema...');

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cleaner_incentives';
    `);

    console.log('Columns:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

checkTable();
