import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';

export const getWorkerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;
    const { range = 'day', date } = req.query; // 'day' | 'week' | 'month'

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Calculate dates based on range
    const selectedDate = date ? new Date(date as string) : new Date();
    let dateCondition = '';

    if (range === 'week') {
      // Filter for the week of the selected date (ISO week)
      dateCondition = `AND t2.completed_at >= date_trunc('week', $2::date) AND t2.completed_at < date_trunc('week', $2::date) + interval '1 week'`;
    } else if (range === 'month') {
      // Filter for the month
      dateCondition = `AND t2.completed_at >= date_trunc('month', $2::date) AND t2.completed_at < date_trunc('month', $2::date) + interval '1 month'`;
    } else {
      // Default 'day'
      dateCondition = `AND t2.completed_at::date = $2::date`;
    }

    // Revenue condition is same but on t3 alias
    const revenueCondition = dateCondition.replace(/t2/g, 't3');

    // Single robust query to get profile and stats
    const query = `
  SELECT 
    u.id as user_id, 
    u.full_name,
    u.document_id as emp_id,
    s_u.full_name as supervisor_name,
    b.building_name as location,
    c.total_earning,
    c.total_tasks,
    (
      SELECT COUNT(*)::int 
      FROM tasks t2 
      WHERE t2.cleaner_id = c.id 
        AND t2.status = 'completed' 
        ${dateCondition}
    ) as period_jobs,
    (
      SELECT COALESCE(SUM(t3.final_price), 0)::float 
      FROM tasks t3 
      WHERE t3.cleaner_id = c.id 
        AND t3.status = 'completed' 
        ${revenueCondition}
    ) as period_revenue,
    (
      SELECT COALESCE(SUM(i_d.amount), 0)::float
      FROM cleaner_incentives i_d
      WHERE i_d.cleaner_id = c.id
        AND i_d.created_at::date = $2::date
    ) as incentive_day,
    (
      SELECT COALESCE(SUM(i_w.amount), 0)::float
      FROM cleaner_incentives i_w
      WHERE i_w.cleaner_id = c.id
        AND i_w.created_at >= date_trunc('week', $2::date)
        AND i_w.created_at < date_trunc('week', $2::date) + interval '1 week'
    ) as incentive_week,
    (
      SELECT COALESCE(SUM(i_m.amount), 0)::float
      FROM cleaner_incentives i_m
      WHERE i_m.cleaner_id = c.id
        AND i_m.created_at >= date_trunc('month', $2::date)
        AND i_m.created_at < date_trunc('month', $2::date) + interval '1 month'
    ) as incentive_month
  FROM users u
  LEFT JOIN cleaners c ON c.user_id = u.id
  LEFT JOIN supervisors s ON c.supervisor_id = s.id
  LEFT JOIN users s_u ON s.user_id = s_u.id
  LEFT JOIN buildings b ON s.building_id = b.id
  WHERE u.id = $1
`;

    const result = await pool.query(query, [workerId, selectedDate]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const data = result.rows[0];

    // Get active incentives to calculate progress
    const incentivesRes = await pool.query(
      `SELECT id, target_tasks, incentive_amount 
       FROM incentives 
       WHERE active = true 
       ORDER BY target_tasks ASC`
    );

    const periodJobs = data.period_jobs || 0;

    // Find next target
    const nextIncentive = incentivesRes.rows.find((rule) => rule.target_tasks > periodJobs);

    // If no next target (all achieved), use the last one or show completed state
    // For now, let's show the highest target if all are done, or the next one.
    const currentTarget = nextIncentive || incentivesRes.rows[incentivesRes.rows.length - 1];

    const nextTarget = currentTarget ? currentTarget.target_tasks : 10; // Default 10 if no rules
    const incentiveAmount = currentTarget ? currentTarget.incentive_amount : 0;

    // Calculate progress percentage
    // If target is 10 and done is 3, progress is 30%
    // If done > target (all targets met), progress is 100%
    const progress = Math.min((periodJobs / nextTarget) * 100, 100);

    return res.json({
      success: true,
      name: data.full_name,
      empId: data.emp_id,
      jobsDone: data.total_tasks || 0,
      totalRevenue: data.total_earning || 0,
      supervisor: {
        name: data.supervisor_name || 'Not Assigned',
        location: data.location || 'N/A',
      },
      period: {
        range: range,
        date: selectedDate,
        jobs: periodJobs,
        revenue: data.period_revenue || 0,
        next_target: nextTarget,
        incentive_amount: incentiveAmount,
        progress: progress,
      },
      incentives: {
        day: data.incentive_day || 0,
        week: data.incentive_week || 0,
        month: data.incentive_month || 0,
      },
    });
  } catch (err) {
    console.error('DASHBOARD ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
};
