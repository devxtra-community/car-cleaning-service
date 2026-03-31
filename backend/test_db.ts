import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const { rows } = await pool.query("SELECT email, role FROM users WHERE role = 'admin' LIMIT 1");
    console.log('Test User:', rows[0]);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await pool.end();
  }
})();
