import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const checkConstraints = async () => {
  const client = await pool.connect();
  try {
    console.log('Checking foreign key constraints for tasks table...');

    // Query to find what tasks.cleaner_id references
    const res = await client.query(`
      SELECT
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='tasks' AND kcu.column_name='cleaner_id';
    `);

    console.log('Constraint details:', res.rows);

    // Also check typical cleaners table structure
    const cleanerRes = await client.query('SELECT * FROM cleaners LIMIT 1');
    if (cleanerRes.rows.length > 0) {
      console.log('Sample cleaner record:', cleanerRes.rows[0]);
    } else {
      console.log('No cleaner records found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

checkConstraints();
