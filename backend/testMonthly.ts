import { pool } from './src/database/connectDatabase';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
     const month = null; // simulate the query without month param
     const res = await pool.query(
       `
       SELECT
         DATE_TRUNC('month', completed_at) as month,
         COUNT(id)::int as total_tasks,
         COALESCE(SUM(final_price), 0)::float as total_revenue
       FROM tasks
       WHERE status = 'completed'
         AND ($1::date IS NULL OR DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', $1::date))
       GROUP BY DATE_TRUNC('month', completed_at)
       ORDER BY month DESC
       `,
       [month]
     );
    console.log('Monthly View SUCCESS:', res.rows.length);
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}

run();
