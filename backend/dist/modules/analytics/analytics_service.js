"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionsReconciliation = exports.getCleanerPerformance = exports.getMonthlyProgress = exports.getWeeklyProgress = exports.getDailyProgress = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const getDailyProgress = async (date) => {
    const res = await connectDatabase_1.pool.query(`
    SELECT *
    FROM daily_progress_view
    WHERE ($1::date IS NULL OR date = $1)
    ORDER BY date DESC
    `, [date || null]);
    return res.rows;
};
exports.getDailyProgress = getDailyProgress;
const getWeeklyProgress = async (weekStart) => {
    const res = await connectDatabase_1.pool.query(`
    SELECT *
    FROM weekly_progress_view
    WHERE ($1::date IS NULL OR week_start = $1)
    ORDER BY week_start DESC
    `, [weekStart || null]);
    return res.rows;
};
exports.getWeeklyProgress = getWeeklyProgress;
const getMonthlyProgress = async (month) => {
    const res = await connectDatabase_1.pool.query(`
    SELECT *
    FROM monthly_progress_view
    WHERE ($1::date IS NULL OR month = DATE_TRUNC('month', $1::date))
    ORDER BY month DESC
    `, [month || null]);
    return res.rows;
};
exports.getMonthlyProgress = getMonthlyProgress;
const getCleanerPerformance = async (period) => {
    // period can be 'daily', 'weekly', 'monthly' or null for all time
    let dateFilter = '';
    if (period === 'daily')
        dateFilter = `AND t.completed_at >= CURRENT_DATE`;
    else if (period === 'weekly')
        dateFilter = `AND t.completed_at >= date_trunc('week', CURRENT_DATE)`;
    else if (period === 'monthly')
        dateFilter = `AND t.completed_at >= date_trunc('month', CURRENT_DATE)`;
    const res = await connectDatabase_1.pool.query(`SELECT 
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
     ORDER BY completed_tasks DESC`);
    return res.rows;
};
exports.getCleanerPerformance = getCleanerPerformance;
const getCollectionsReconciliation = async (month) => {
    let dateFilter = '';
    if (month)
        dateFilter = `AND t.completed_at >= date_trunc('month', $1::date) AND t.completed_at < date_trunc('month', $1::date) + interval '1 month'`;
    const queryParams = month ? [month] : [];
    const res = await connectDatabase_1.pool.query(`SELECT 
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
     ORDER BY cash_collected DESC`, queryParams);
    return res.rows;
};
exports.getCollectionsReconciliation = getCollectionsReconciliation;
