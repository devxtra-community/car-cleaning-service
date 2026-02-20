"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supervisorReportService = exports.getSupervisorWorkersService = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const getSupervisorWorkersService = async (supervisorId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT u.id, u.full_name, u.email, u.role
    FROM supervisor_workers sw
    JOIN users u ON u.id = sw.worker_id
    WHERE sw.supervisor_id=$1
    `, [supervisorId]);
    return result.rows;
};
exports.getSupervisorWorkersService = getSupervisorWorkersService;
const supervisorReportService = async (supervisorId, period) => {
    let filter = '';
    if (period === 'day')
        filter = `t.completed_at::date = CURRENT_DATE`;
    else if (period === 'week')
        filter = `t.completed_at >= date_trunc('week', NOW())`;
    else
        filter = `t.completed_at >= date_trunc('month', NOW())`;
    const result = await connectDatabase_1.pool.query(`
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
    `, [supervisorId]);
    return result.rows;
};
exports.supervisorReportService = supervisorReportService;
