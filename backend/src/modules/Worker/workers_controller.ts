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

export const getWorkerPenalties = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;
    const { period = 'week' } = req.query; // 'day' | 'week' | 'month'

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get cleaner_id from user_id (workerId)
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }
    const cleanerId = cleanerRes.rows[0].id;

    let dateCondition = '';

    // Using current date as reference

    if (period === 'day') {
      dateCondition = `AND created_at::date = CURRENT_DATE`;
    } else if (period === 'week') {
      // Current week
      dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
    } else if (period === 'month') {
      // Current month
      dateCondition = `
        AND created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      `;
    } else {
      // Default to all time or specific limit if needed, but let's default to week if invalid
      dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
    }

    const query = `
      SELECT 
        id,
        amount,
        reason,
        created_at
      FROM penalties
      WHERE cleaner_id = $1
      ${dateCondition}
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [cleanerId]);

    const totalAmount = result.rows.reduce((sum, p) => sum + Number(p.amount), 0);

    return res.json({
      success: true,
      data: result.rows,
      meta: {
        totalAmount,
        count: result.rows.length,
        period,
      },
    });
  } catch (err) {
    console.error('GET PENALTIES ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

export const getWorkerWalletStats = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;
    const { range = 'day', date } = req.query; // 'day' | 'week' | 'month'

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get cleaner_id
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }
    const cleanerId = cleanerRes.rows[0].id;

    // Calculate dates based on range
    const selectedDate = date ? new Date(date as string) : new Date();
    let dateCondition = '';
    let penaltyDateCondition = '';

    if (range === 'week') {
      dateCondition = `AND completed_at >= date_trunc('week', $2::date) AND completed_at < date_trunc('week', $2::date) + interval '1 week'`;
      penaltyDateCondition = `AND created_at >= date_trunc('week', $2::date) AND created_at < date_trunc('week', $2::date) + interval '1 week'`;
    } else if (range === 'month') {
      dateCondition = `AND completed_at >= date_trunc('month', $2::date) AND completed_at < date_trunc('month', $2::date) + interval '1 month'`;
      penaltyDateCondition = `AND created_at >= date_trunc('month', $2::date) AND created_at < date_trunc('month', $2::date) + interval '1 month'`;
    } else {
      // Default 'day'
      dateCondition = `AND completed_at::date = $2::date`;
      penaltyDateCondition = `AND created_at::date = $2::date`;
    }

    // 1. Tasks Details
    const tasksQuery = `
      SELECT 
        id,
        car_number,
        COALESCE(final_price, 0)::float as amount,
        completed_at as date,
        'task' as type
      FROM tasks 
      WHERE cleaner_id = $1 
        AND status = 'completed' 
        ${dateCondition}
    `;
    const tasksRes = await pool.query(tasksQuery, [cleanerId, selectedDate]);

    // 2. Incentives Details
    const incentivesQuery = `
      SELECT 
        id,
        amount::float as amount,
        created_at as date,
        'incentive' as type,
        'Performance Bonus' as description
      FROM cleaner_incentives
      WHERE cleaner_id = $1
        ${penaltyDateCondition}
    `;
    const incentivesRes = await pool.query(incentivesQuery, [cleanerId, selectedDate]);

    // 3. Penalties Details
    const penaltiesQuery = `
      SELECT 
        id,
        amount::float as amount,
        created_at as date,
        'penalty' as type,
        reason as description
      FROM penalties
      WHERE cleaner_id = $1
        ${penaltyDateCondition}
    `;
    const penaltiesRes = await pool.query(penaltiesQuery, [cleanerId, selectedDate]);

    // Only include TASKS in the wallet transactions (not incentives/penalties)
    const transactions = tasksRes.rows
      .map((t) => ({
        id: t.id,
        type: 'task' as const,
        description: `Car wash - ${t.car_number}`,
        amount: t.amount,
        date: t.date,
        isCredit: true,
        car_number: t.car_number,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals
    const taskTotal = tasksRes.rows.reduce((sum, t) => sum + t.amount, 0);
    const incentiveTotal = incentivesRes.rows.reduce((sum, i) => sum + i.amount, 0);
    const penaltyTotal = penaltiesRes.rows.reduce((sum, p) => sum + p.amount, 0);

    return res.json({
      success: true,
      range,
      date: selectedDate,
      summary: {
        totalEarnings: taskTotal, // Only job earnings
        taskCount: tasksRes.rows.length,
        taskTotal,
        incentiveTotal,
        penaltyTotal,
      },
      transactions,
    });
  } catch (err) {
    console.error('WALLET STATS ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

export const getWorkerTaskLogs = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;
    const { date } = req.query;

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get cleaner_id
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }
    const cleanerId = cleanerRes.rows[0].id;

    // Use provided date or default to today
    const selectedDate = date ? new Date(date as string) : new Date();

    // Fetch all completed tasks for the selected date
    const tasksQuery = `
      SELECT 
        id,
        cleaner_id,
        owner_name,
        owner_phone,
        car_number,
        car_model,
        car_color,
        car_type,
        car_image_url,
        before_photo_url,
        after_photo_url,
        after_wash_image_url,
        final_price,
        payment_method,
        created_at,
        completed_at,
        status
      FROM tasks
      WHERE cleaner_id = $1
        AND status = 'completed'
        AND completed_at::date = $2::date
      ORDER BY completed_at DESC
    `;

    const tasksRes = await pool.query(tasksQuery, [cleanerId, selectedDate]);

    return res.json({
      success: true,
      date: selectedDate,
      count: tasksRes.rows.length,
      tasks: tasksRes.rows,
    });
  } catch (err) {
    console.error('TASK LOGS ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
