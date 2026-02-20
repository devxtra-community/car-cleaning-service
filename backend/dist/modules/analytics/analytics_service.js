"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyProgress = exports.getWeeklyProgress = exports.getDailyProgress = void 0;
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
