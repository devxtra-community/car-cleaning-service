import { pool } from '../../database/connectDatabase';

export const getSupervisorWorkersService = async (supervisorId: string) => {
  const result = await pool.query(
    `
    SELECT u.id, u.full_name, u.email, u.role
    FROM supervisor_workers sw
    JOIN users u ON u.id = sw.worker_id
    WHERE sw.supervisor_id=$1
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
