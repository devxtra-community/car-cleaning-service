import { pool } from '../../database/connectDatabase';

export const getSupervisorWorkersService = async (supervisorId: string) => {
  const result = await pool.query(
    `
    SELECT 
      u.id, 
      u.full_name, 
      u.email, 
      u.role,
      t.id AS current_task_id,
      t.owner_name,
      t.owner_phone,
      t.car_number,
      t.car_model,
      t.car_type,
      t.car_color,
      t.task_amount,
      t.created_at AS task_started_at,
      CASE WHEN t.id IS NOT NULL THEN 'working' ELSE 'idle' END AS status
    FROM cleaners c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN LATERAL (
      SELECT * FROM tasks 
      WHERE cleaner_id = c.user_id AND status != 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    ) t ON true
    WHERE c.supervisor_id = $1
    ORDER BY status DESC, u.full_name ASC
    `,
    [supervisorId]
  );
  return result.rows;
};

export const supervisorReportService = async (supervisorId: string, period: string) => {
  let filter = '';
  if (period === 'day') filter = `t.completed_at::date = CURRENT_DATE`;
  else if (period === 'week') filter = `t.completed_at >= date_trunc('week', NOW())`;
  else filter = `t.completed_at >= date_trunc('month', NOW())`;

  const result = await pool.query(
    `
    SELECT 
      u.id as worker_id,
      u.full_name,
      COUNT(t.id)::int as total_tasks
    FROM tasks t
    JOIN supervisor_workers sw ON sw.worker_id = t.worker_id
    JOIN users u ON u.id = t.worker_id
    WHERE sw.supervisor_id=$1
      AND t.status='completed'
      AND ${filter}
    GROUP BY u.id, u.full_name
    ORDER BY total_tasks DESC
    `,
    [supervisorId]
  );

  return result.rows;
};
