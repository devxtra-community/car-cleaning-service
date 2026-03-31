import { pool } from '../../database/connectDatabase';

export const getDailyProgress = async (date?: string) => {
  const res = await pool.query(
    `
    SELECT
      DATE(completed_at) as date,
      COUNT(id)::int as total_tasks,
      COALESCE(SUM(final_price), 0)::float as total_revenue
    FROM tasks
    WHERE status = 'completed'
      AND ($1::date IS NULL OR DATE(completed_at) = $1::date)
    GROUP BY DATE(completed_at)
    ORDER BY date DESC
    `,
    [date || null]
  );

  return res.rows;
};

export const getWeeklyProgress = async (weekStart?: string) => {
  const res = await pool.query(
    `
    SELECT
      DATE_TRUNC('week', completed_at) as week_start,
      COUNT(id)::int as total_tasks,
      COALESCE(SUM(final_price), 0)::float as total_revenue
    FROM tasks
    WHERE status = 'completed'
      AND ($1::date IS NULL OR DATE_TRUNC('week', completed_at) = DATE_TRUNC('week', $1::date))
    GROUP BY DATE_TRUNC('week', completed_at)
    ORDER BY week_start DESC
    `,
    [weekStart || null]
  );

  return res.rows;
};

export const getMonthlyProgress = async (month?: string) => {
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
    [month || null]
  );

  return res.rows;
};

export const getCleanerPerformance = async (period?: string) => {
  let taskDateFilter = '';
  let incentiveDateFilter = '';
  let penaltyDateFilter = '';

  if (period === 'daily') {
    taskDateFilter = `AND t.completed_at >= CURRENT_DATE`;
    incentiveDateFilter = `AND ci.created_at >= CURRENT_DATE`;
    penaltyDateFilter = `AND p.created_at >= CURRENT_DATE`;
  } else if (period === 'weekly') {
    taskDateFilter = `AND t.completed_at >= date_trunc('week', CURRENT_DATE)`;
    incentiveDateFilter = `AND ci.created_at >= date_trunc('week', CURRENT_DATE)`;
    penaltyDateFilter = `AND p.created_at >= date_trunc('week', CURRENT_DATE)`;
  } else if (period === 'monthly') {
    taskDateFilter = `AND t.completed_at >= date_trunc('month', CURRENT_DATE)`;
    incentiveDateFilter = `AND ci.created_at >= date_trunc('month', CURRENT_DATE)`;
    penaltyDateFilter = `AND p.created_at >= date_trunc('month', CURRENT_DATE)`;
  }

  const res = await pool.query(
    `SELECT 
      c.id AS cleaner_id,
      u.full_name as cleaner_name,
      u.email as cleaner_email,
      s_u.full_name as supervisor_name,
      b.building_name,
      COUNT(t.id)::int as total_tasks,
      COALESCE((
        SELECT SUM(ci.amount)::float
        FROM cleaner_incentives ci
        WHERE ci.cleaner_id = c.id ${incentiveDateFilter}
      ), 0)::float as total_incentives,
      COALESCE((
        SELECT SUM(p.amount)::float
        FROM penalties p
        WHERE p.cleaner_id = c.id ${penaltyDateFilter}
      ), 0)::float as total_penalties,
      COALESCE(SUM(t.final_price), 0)::float as total_earnings
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN supervisors s ON c.supervisor_id = s.id
     LEFT JOIN users s_u ON s.user_id = s_u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN tasks t ON t.cleaner_id = c.id AND t.status = 'completed' ${taskDateFilter}
     WHERE u.role = 'cleaner'
     GROUP BY c.id, u.full_name, u.email, s_u.full_name, b.building_name
     ORDER BY total_tasks DESC, cleaner_name ASC`
  );

  return res.rows;
};

export const getCollectionsReconciliation = async (month?: string) => {
  let taskDateFilter = '';
  let incentiveDateFilter = '';
  let penaltyDateFilter = '';

  if (month)
    taskDateFilter = `AND t.completed_at >= date_trunc('month', $1::date) AND t.completed_at < date_trunc('month', $1::date) + interval '1 month'`;

  if (month)
    incentiveDateFilter = `AND ci.created_at >= date_trunc('month', $1::date) AND ci.created_at < date_trunc('month', $1::date) + interval '1 month'`;

  if (month)
    penaltyDateFilter = `AND p.created_at >= date_trunc('month', $1::date) AND p.created_at < date_trunc('month', $1::date) + interval '1 month'`;

  const queryParams = month ? [month] : [];

  const res = await pool.query(
    `SELECT 
      c.id AS cleaner_id,
      u.full_name as cleaner_name,
      b.building_name,
      COUNT(t.id)::int as total_jobs,
      COALESCE(SUM(CASE WHEN t.payment_method = 'Cash' THEN t.amount_charged ELSE 0 END), 0)::float as cash_collected,
      COALESCE(SUM(CASE WHEN t.payment_method = 'Online' OR t.payment_method = 'UPI' OR t.payment_method = 'Card' THEN t.amount_charged ELSE 0 END), 0)::float as online_collected,
      (
        COALESCE(u.base_salary, 0)
        + COALESCE((
            SELECT SUM(ci.amount)::float
            FROM cleaner_incentives ci
            WHERE ci.cleaner_id = c.id ${incentiveDateFilter}
          ), 0)
        - COALESCE((
            SELECT SUM(p.amount)::float
            FROM penalties p
            WHERE p.cleaner_id = c.id ${penaltyDateFilter}
          ), 0)
      )::float as salary_owed
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN tasks t ON t.cleaner_id = c.id AND t.status = 'completed' ${taskDateFilter}
     GROUP BY c.id, u.full_name, b.building_name, u.base_salary
     ORDER BY cash_collected DESC`,
    queryParams
  );
  return res.rows;
};

export const getPeakActivity = async (period: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
  let interval = '1 month';
  if (period === 'daily') interval = '1 day';
  else if (period === 'weekly') interval = '1 week';

  const res = await pool.query(
    `SELECT 
      EXTRACT(HOUR FROM completed_at) as hour,
      COUNT(id) as task_count
     FROM tasks
     WHERE status = 'completed'
     AND completed_at >= NOW() - CAST($1 AS INTERVAL)
     GROUP BY hour
     ORDER BY hour`,
    [interval]
  );
  return res.rows;
};

export const getBuildingComparisonService = async () => {
  const query = `
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
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export const getCustomerRatingSummaryService = async () => {
  const query = `
    SELECT 
      rating::int,
      COUNT(*)::int as count
    FROM reviews
    GROUP BY rating
    ORDER BY rating DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export const getFraudTrendsService = async () => {
  const query = `
    SELECT 
      DATE(f.created_at) as date,
      b.building_name,
      f.type as fraud_type,
      COUNT(*) as incident_count
    FROM fraud_cases f
    JOIN tasks t ON f.task_id = t.id
    JOIN buildings b ON t.building_id = b.id
    GROUP BY DATE(f.created_at), b.building_name, f.type
    ORDER BY DATE(f.created_at) DESC, incident_count DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export const getAdminSummaryService = async () => {
  const res = await pool.query(`
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

  const summary = res.rows[0];
  return summary;
};

export const getCustomerReportService = async () => {
  const res = await pool.query(`
    SELECT
      t.id,
      cav.owner_name,
      cav.car_number,
      cav.car_type,
      u.full_name as cleaner_name,
      COALESCE(
        (SELECT SUM(p.amount) FROM penalties p WHERE p.task_id = t.id), 0
      )::float as penalty_amount,
      COALESCE(t.task_amount, 0)::float as task_amount,
      COALESCE(t.final_price, t.task_amount, 0)::float as final_price,
      t.status,
      t.completed_at
    FROM tasks t
    LEFT JOIN cleaner_assigned_vehicles cav ON t.vehicle_id = cav.id
    LEFT JOIN cleaners c ON t.cleaner_id = c.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE (t.completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = 
          (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date
       OR t.status != 'completed'
    ORDER BY t.created_at DESC
    LIMIT 100
  `);

  return res.rows;
};
