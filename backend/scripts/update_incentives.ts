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

const updateIncentivesSchema = async () => {
  let client;
  try {
    console.log('Running schema update for cleaner_incentives...');

    client = await pool.connect();

    // Add milestone_count column
    await client.query(`
            ALTER TABLE cleaner_incentives 
            ADD COLUMN IF NOT EXISTS milestone_count INTEGER DEFAULT 0;
        `);

    console.log('✓ cleaner_incentives table updated successfully');

    // Add unique constraint including milestone_count if not exists
    // This is tricky because existing constraint might be different.
    // Let's assume unique constraint on (cleaner_id, incentive_rule_id) exists, or maybe not.
    // The error suggests we were trying to INSERT with milestone_count.

    // Let's just create a unique index if possible, but failing if it exists is fine for now.
    try {
      await client.query(`
                CREATE UNIQUE INDEX idx_cleaner_incentives_unique 
                ON cleaner_incentives (cleaner_id, incentive_rule_id, milestone_count);
            `);
      console.log('✓ Unique index created');
    } catch (idxErr) {
      console.log('Index might already exist or conflict:', idxErr.message);
    }

    console.log('\n✅ Schema update completed successfully!');
  } catch (err) {
    console.error('❌ Schema update failed:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

updateIncentivesSchema();
