import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const investigateMissingCleaner = async () => {
  let client;
  const userId = 'fc826552-b178-4a48-9cdd-3ba1d016ea8d';
  try {
    console.log(`Investigating user: ${userId}`);

    client = await pool.connect();

    // Check user details
    const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userRes.rows.length === 0) {
      console.log('❌ User NOT found in users table!');
      return;
    }

    const user = userRes.rows[0];
    console.log('✅ User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role, // This is key!
    });

    // Check for cleaner record
    const cleanerRes = await client.query('SELECT * FROM cleaners WHERE user_id = $1', [userId]);

    if (cleanerRes.rows.length === 0) {
      console.log('❌ Cleaner record MISSING for this user.');

      // Fix it: Create the cleaner record regardless of role (or fix role too if needed)
      // If the role is wrong, update it? Or just create the record?
      // For now, let's create the record to unblock them.

      console.log('Creating cleaner record now...');
      await client.query(
        `INSERT INTO cleaners (user_id, total_tasks, total_earning)
         VALUES ($1, 0, 0)`,
        [userId]
      );
      console.log('✅ Created cleaner record successfully.');

      // If role is not worker/cleaner, maybe update it? Let's see what it is first.
      if (user.role !== 'worker' && user.role !== 'cleaner') {
        console.log(`User role is '${user.role}', updating to 'worker'...`);
        await client.query("UPDATE users SET role = 'worker' WHERE id = $1", [userId]);
        console.log("✅ Updated user role to 'worker'.");
      }
    } else {
      console.log('✅ Cleaner record found:', cleanerRes.rows[0]);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

investigateMissingCleaner();
