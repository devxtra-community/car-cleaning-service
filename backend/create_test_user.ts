import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const email = 'testadmin@example.com';
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      console.log('User already exists');
      process.exit(0);
    }

    await pool.query(
      `INSERT INTO users (email, password, role, full_name, document, document_id, age, nationality, is_active)
       VALUES ($1, $2, 'admin', 'Test Admin', 'doc_url', '12345', 30, 'US', true)`,
      [email, hashedPassword]
    );
    console.log('Created test user:', email);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await pool.end();
  }
})();
