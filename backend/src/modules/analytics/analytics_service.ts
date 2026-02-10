import { pool } from '../../database/connectDatabase';

export const getDailyProgress = async (date?: string) => {
  const res = await pool.query(
    `
    SELECT *
    FROM daily_progress_view
    WHERE ($1::date IS NULL OR date = $1)
    ORDER BY date DESC
    `,
    [date || null]
  );

  return res.rows;
};

export const getWeeklyProgress = async (weekStart?: string) => {
  const res = await pool.query(
    `
    SELECT *
    FROM weekly_progress_view
    WHERE ($1::date IS NULL OR week_start = $1)
    ORDER BY week_start DESC
    `,
    [weekStart || null]
  );

  return res.rows;
};

export const getMonthlyProgress = async (month?: string) => {
  const res = await pool.query(
    `
    SELECT *
    FROM monthly_progress_view
    WHERE ($1::date IS NULL OR month = DATE_TRUNC('month', $1::date))
    ORDER BY month DESC
    `,
    [month || null]
  );

  return res.rows;
};
