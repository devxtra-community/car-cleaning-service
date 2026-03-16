import { pool } from '../../database/connectDatabase';
import { getCache, setCache } from '../../config/redis';

export const getDailyProgress = async (date?: string) => {
  const cacheKey = `analytics:daily:${date || 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const res = await pool.query(
    `
    SELECT *
    FROM daily_progress_view
    WHERE ($1::date IS NULL OR date = $1)
    ORDER BY date DESC
    `,
    [date || null]
  );

  await setCache(cacheKey, res.rows, 300); // 5 min cache
  return res.rows;
};

export const getWeeklyProgress = async (weekStart?: string) => {
  const cacheKey = `analytics:weekly:${weekStart || 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const res = await pool.query(
    `
    SELECT *
    FROM weekly_progress_view
    WHERE ($1::date IS NULL OR week_start = $1)
    ORDER BY week_start DESC
    `,
    [weekStart || null]
  );

  await setCache(cacheKey, res.rows, 1800); // 30 min cache
  return res.rows;
};

export const getMonthlyProgress = async (month?: string) => {
  const cacheKey = `analytics:monthly:${month || 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const res = await pool.query(
    `
    SELECT *
    FROM monthly_progress_view
    WHERE ($1::date IS NULL OR month = DATE_TRUNC('month', $1::date))
    ORDER BY month DESC
    `,
    [month || null]
  );

  await setCache(cacheKey, res.rows, 3600); // 1 hour cache
  return res.rows;
};

export const getCleanerPerformance = async (period?: string) => {
  const cacheKey = `analytics:cleaner_perf:${period || 'all'}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // period can be 'daily', 'weekly', 'monthly' or null for all time
  let dateFilter = '';
  if (period === 'daily') dateFilter = `AND t.completed_at >= CURRENT_DATE`;
  else if (period === 'weekly')
    dateFilter = `AND t.completed_at >= date_trunc('week', CURRENT_DATE)`;
  else if (period === 'monthly')
    dateFilter = `AND t.completed_at >= date_trunc('month', CURRENT_DATE)`;

  const res = await pool.query(
    `SELECT 
      c.id AS cleaner_id,
      u.full_name as cleaner_name,
      b.building_name,
      COUNT(t.id) as completed_tasks,
      COALESCE(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at))/60), 0) as avg_wash_time_mins
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN tasks t ON t.cleaner_id = c.id AND t.status = 'completed' ${dateFilter}
     GROUP BY c.id, u.full_name, b.building_name
     ORDER BY completed_tasks DESC`
  );

  await setCache(cacheKey, res.rows, 600); // 10 min cache
  return res.rows;
};

export const getCollectionsReconciliation = async (month?: string) => {
  let dateFilter = '';
  if (month)
    dateFilter = `AND t.completed_at >= date_trunc('month', $1::date) AND t.completed_at < date_trunc('month', $1::date) + interval '1 month'`;

  const queryParams = month ? [month] : [];

  const res = await pool.query(
    `SELECT 
      c.id AS cleaner_id,
      u.full_name as cleaner_name,
      b.building_name,
      COUNT(t.id) as total_jobs,
      SUM(CASE WHEN t.payment_method = 'Cash' THEN t.amount_charged ELSE 0 END) as cash_collected,
      SUM(CASE WHEN t.payment_method = 'Online' OR t.payment_method = 'UPI' OR t.payment_method = 'Card' THEN t.amount_charged ELSE 0 END) as online_collected,
      COALESCE((SELECT net_salary FROM salaries s WHERE s.cleaner_id = c.id ORDER BY s.created_at DESC LIMIT 1), 0) as salary_owed
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN tasks t ON t.cleaner_id = c.id AND t.status = 'completed' ${dateFilter}
     GROUP BY c.id, u.full_name, b.building_name
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
  const cacheKey = 'analytics:fraud_trends';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

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
  await setCache(cacheKey, rows, 1800); // 30 min cache
  return rows;
};

export const getAdminSummaryService = async () => {
  const cacheKey = 'analytics:admin_summary';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const res = await pool.query(`
    SELECT
      (SELECT COALESCE(SUM(paid_amount), 0)::float FROM salaries WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as total_salary_paid,
      (SELECT COUNT(*)::int FROM cleaners WHERE is_active = true) as total_cleaners,
      (SELECT COUNT(*)::int FROM cleaner_assigned_vehicles WHERE is_active = true) as total_vehicles,
      (SELECT COUNT(*)::int FROM buildings) as total_buildings,
      (SELECT COUNT(*)::int FROM incentive_rules WHERE is_active = true) as active_incentive_rules,
      (SELECT COUNT(*)::int FROM users WHERE role = 'supervisor' AND is_active = true) as total_supervisors,
      (SELECT COUNT(*)::int FROM attendance WHERE date = CURRENT_DATE AND cleaner_id IS NOT NULL) as cleaners_present,
      (SELECT COUNT(*)::int FROM attendance WHERE date = CURRENT_DATE AND cleaner_id IS NULL) as supervisors_present,
      (SELECT COUNT(*)::int FROM tasks WHERE status = 'completed' AND (completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE) as tasks_done_today,
      (SELECT COUNT(*)::int FROM tasks WHERE status = 'pending') as tasks_pending,
      (SELECT COUNT(*)::int FROM tasks WHERE status IN ('started', 'working')) as tasks_active
  `);

  const summary = res.rows[0];
  await setCache(cacheKey, summary, 600); // 10 min cache
  return summary;
};

export const getCustomerReportService = async () => {
  const cacheKey = 'analytics:customer_report';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

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

  await setCache(cacheKey, res.rows, 300); // 5 min cache
  return res.rows;
};
