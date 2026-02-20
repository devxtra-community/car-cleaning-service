require('dotenv').config();
import { pool } from '../database/connectDatabase';

const refreshTask = async () => {
  try {
    // Get the latest task
    const latestRes = await pool.query(`
      SELECT id FROM tasks 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (latestRes.rows.length === 0) {
      console.log('No tasks found.');
      return;
    }

    // const taskId = latestRes.rows[0].id;
    const taskId = 'ffb17c7f-1e73-48b1-aefe-27a1de583ccb';

    // Update created_at to NOW + 5.5 hours to compensate for timezone shift
    // (Column is likely timestamp without timezone, and gets read as local-to-UTC)
    await pool.query(
      `
      UPDATE tasks 
      SET created_at = NOW() + interval '5 hours 30 minutes'
      WHERE id = $1
    `,
      [taskId]
    );

    console.log('Successfully refreshed task timestamp for task:', taskId);
  } catch (error) {
    console.error('Error refreshing task:', error);
  } finally {
    await pool.end();
  }
};

refreshTask();
