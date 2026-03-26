import { pool } from './src/database/connectDatabase';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
     let res = await pool.query(`
    SELECT
      (SELECT COALESCE(SUM(final_salary), 0)::float FROM salaries WHERE status = 'paid' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as total_salary_paid,
      (SELECT COUNT(*)::int FROM cleaners WHERE is_active = true) as total_cleaners,
      (SELECT COUNT(*)::int FROM cleaner_assigned_vehicles WHERE is_active = true) as total_vehicles,
      (SELECT COUNT(*)::int FROM buildings) as total_buildings,
      (SELECT COUNT(*)::int FROM incentive_rules WHERE active = true) as active_incentive_rules,
      (SELECT COUNT(*)::int FROM users WHERE role = 'supervisor' AND is_active = true) as total_supervisors,
      (SELECT COUNT(*)::int FROM attendance WHERE date = CURRENT_DATE AND cleaner_id IS NOT NULL) as cleaners_present,
      (SELECT COUNT(*)::int FROM attendance WHERE date = CURRENT_DATE AND cleaner_id IS NULL) as supervisors_present,
      (SELECT COUNT(*)::int FROM tasks WHERE status = 'completed' AND (completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE) as tasks_done_today,
      (SELECT COUNT(*)::int FROM tasks WHERE status = 'pending') as tasks_pending,
      (SELECT COUNT(*)::int FROM tasks WHERE status IN ('started', 'working')) as tasks_active
  `);
    console.log('Admin Summary SUCCESS');
    
    res = await pool.query(`
      SELECT *
      FROM monthly_progress_view
      ORDER BY month DESC
      LIMIT 1
    `);
    console.log('Monthly View SUCCESS');

    res = await pool.query(`
      SELECT 
       b.id as building_id,
       b.building_name,
       b.location,
       COUNT(t.id)::int as total_washes,
       COALESCE(SUM(t.final_price), 0)::float as total_revenue,
       COALESCE(AVG(r.rating), 0)::float as avg_rating
      FROM buildings b
      LEFT JOIN tasks t ON b.id = t.building_id AND t.status = 'completed'
      LEFT JOIN reviews r ON t.id = r.task_id
      GROUP BY b.id, b.building_name, b.location
      ORDER BY total_revenue DESC
      LIMIT 1
    `);
    console.log('Building Comparison SUCCESS');
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}

run();
