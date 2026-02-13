const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const fixTasksStatus = async () => {
  let client;
  try {
    console.log('Fixing tasks table status default...');

    client = await pool.connect();

    // 1. Alter default value to 'pending'
    await client.query(`
            ALTER TABLE tasks 
            ALTER COLUMN status SET DEFAULT 'pending';
        `);
    console.log('✓ Default value set to "pending"');

    // 2. Revert tasks that were incorrectly marked as completed
    // Logic: if status is 'completed' but completed_at is NULL
    // AND maybe other fields like final_price are null?
    // Let's rely on completed_at being NULL.

    const updateRes = await client.query(`
            UPDATE tasks 
            SET status = 'pending' 
            WHERE status = 'completed' AND completed_at IS NULL
            RETURNING id;
        `);

    console.log(`✓ Reverted ${updateRes.rowCount} tasks to "pending" status.`);
    if (updateRes.rowCount > 0) {
      console.log(
        'IDs:',
        updateRes.rows.map((r) => r.id)
      );
    }

    console.log('\n✅ Task status fix completed!');
  } catch (err) {
    console.error('❌ Fix failed:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

fixTasksStatus();
