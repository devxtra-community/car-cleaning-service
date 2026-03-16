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

const ensureCleanerRecord = async () => {
  let client;
  try {
    console.log('Ensuring cleaner records exist for all workers...');

    client = await pool.connect();

    // Get all users with role 'worker' or 'cleaner'
    const usersRes = await client.query(`
      SELECT id, username, email 
      FROM users 
      WHERE role IN ('worker', 'cleaner')
    `);

    console.log(`Found ${usersRes.rows.length} worker/cleaner users`);

    // For each user, ensure they have a cleaner record
    for (const user of usersRes.rows) {
      const cleanerCheck = await client.query('SELECT id FROM cleaners WHERE user_id = $1', [
        user.id,
      ]);

      if (cleanerCheck.rows.length === 0) {
        // Create cleaner record
        await client.query(
          `INSERT INTO cleaners (user_id, total_tasks, total_earning)
           VALUES ($1, 0, 0)`,
          [user.id]
        );
        console.log(`✓ Created cleaner record for user: ${user.username || user.email}`);
      } else {
        console.log(`  Cleaner record already exists for: ${user.username || user.email}`);
      }
    }

    console.log('\n✅ All worker users have cleaner records!');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

ensureCleanerRecord();
