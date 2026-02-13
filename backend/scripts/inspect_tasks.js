const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const inspectTasks = async () => {
  const client = await pool.connect();
  try {
    const userId = 'fc826552-b178-4a48-9cdd-3ba1d016ea8d';
    console.log(`Inspecting for User ID: ${userId}`);

    // Get Cleaner Profile ID
    const cleanerRes = await client.query('SELECT id FROM cleaners WHERE user_id = $1', [userId]);
    const cleanerId = cleanerRes.rows[0]?.id;
    console.log(`Cleaner Profile ID: ${cleanerId}`);

    // Check tasks with User ID as cleaner_id
    const tasksByUser = await client.query(
      'SELECT id, status, cleaner_id FROM tasks WHERE cleaner_id = $1',
      [userId]
    );
    console.log(`Tasks with User ID (${userId}): ${tasksByUser.rowCount}`);
    if (tasksByUser.rowCount > 0) console.log(tasksByUser.rows);

    // Check tasks with Cleaner Profile ID as cleaner_id
    if (cleanerId) {
      const tasksByProfile = await client.query(
        `
                SELECT id, status, cleaner_id, final_price, after_wash_image_url, created_at
                FROM tasks 
                WHERE cleaner_id = $1 
                ORDER BY created_at DESC 
            `,
        [cleanerId]
      );

      console.log(`\nFound ${tasksByProfile.rowCount} tasks for Profile ID ${cleanerId}:`);
      tasksByProfile.rows.forEach((t, i) => {
        console.log(`\n[Task ${i + 1}]`);
        console.log('ID:', t.id);
        console.log('Created At:', t.created_at);
        console.log('Status:', t.status);
        console.log('Final Price:', t.final_price);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
};

inspectTasks();
