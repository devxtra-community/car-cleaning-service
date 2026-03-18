"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupervisorAnalyticsService = exports.deleteSupervisorService = exports.toggleSupervisorStatusService = exports.updateSupervisorService = exports.getSupervisorDetailsService = exports.getSupervisorDashboardSummaryService = exports.supervisorReportService = exports.updateWorkerAssignmentService = exports.getSupervisorWorkersAttendanceService = exports.getSupervisorWorkersService = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getSupervisorWorkersService = async (supervisorId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id, 
      c.id AS cleaner_id,
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
      t.car_color,
      t.amount_charged AS task_amount,
      t.created_at AS task_started_at,
      CASE WHEN t.id IS NOT NULL THEN 'working' ELSE 'idle' END AS status
    FROM cleaners c
    JOIN users u ON u.id = c.user_id
    JOIN supervisors s ON c.supervisor_id = s.id
    LEFT JOIN LATERAL (
      SELECT * FROM tasks 
      WHERE cleaner_id = c.id AND status != 'completed'
      ORDER BY created_at DESC
      LIMIT 1
    ) t ON true
    WHERE s.user_id = $1
    ORDER BY status DESC, u.full_name ASC
    `, [supervisorId]);
    return result.rows;
};
exports.getSupervisorWorkersService = getSupervisorWorkersService;
const getSupervisorWorkersAttendanceService = async (supervisorId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id, 
      u.full_name,
      a.id AS attendance_id,
      a.date,
      a.created_at AS check_in_time,
      CASE WHEN a.id IS NOT NULL THEN 'present' ELSE 'absent' END AS attendance_status
    FROM cleaners c
    JOIN users u ON u.id = c.user_id
    JOIN supervisors s ON c.supervisor_id = s.id
    LEFT JOIN attendance a ON a.worker_id = u.id AND a.date = CURRENT_DATE
    WHERE s.user_id = $1
    ORDER BY u.full_name ASC
    `, [supervisorId]);
    return result.rows;
};
exports.getSupervisorWorkersAttendanceService = getSupervisorWorkersAttendanceService;
const updateWorkerAssignmentService = async (cleanerId, floorId) => {
    const result = await connectDatabase_1.pool.query(`UPDATE cleaners SET floor_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [floorId, cleanerId]);
    return result.rows[0];
};
exports.updateWorkerAssignmentService = updateWorkerAssignmentService;
// Helper to convert a UTC timestamp to IST date string for consistent date comparison
const IST_NOW = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')`;
const IST_DATE = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date`;
const taskIST = (col) => `(${col} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')`;
const supervisorReportService = async (supervisorId, period) => {
    let filter = '';
    if (period === 'day')
        filter = `${taskIST('t.completed_at')}::date = ${IST_DATE}`;
    else if (period === 'week')
        filter = `${taskIST('t.completed_at')} >= date_trunc('week', ${IST_NOW})`;
    else
        filter = `${taskIST('t.completed_at')} >= date_trunc('month', ${IST_NOW})`;
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id as worker_id,
      u.full_name,
      COUNT(t.id)::int as total_tasks
    FROM tasks t
    JOIN cleaners c ON c.id = t.cleaner_id
    JOIN users u ON u.id = c.user_id
    JOIN supervisors s ON c.supervisor_id = s.id
    WHERE s.user_id=$1
      AND t.status='completed'
      AND ${filter}
    GROUP BY u.id, u.full_name
    ORDER BY total_tasks DESC
    `, [supervisorId]);
    return result.rows;
};
exports.supervisorReportService = supervisorReportService;
const getSupervisorDashboardSummaryService = async (supervisorUserId) => {
    const IST_DATE_EXPR = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date`;
    const toIST = (col) => `(${col} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')`;
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      COALESCE(SUM(COALESCE(t.final_price, t.task_amount, 0)), 0)::float as total_earnings,
      COUNT(t.id)::int as total_jobs,
      COALESCE(AVG(r.rating), 0)::float as avg_rating,
      (
        SELECT COUNT(DISTINCT c.id)::int
        FROM cleaners c
        WHERE c.supervisor_id = (SELECT id FROM supervisors WHERE user_id = $1)
          AND EXISTS (
            SELECT 1 FROM tasks t2 
            WHERE t2.cleaner_id = c.id AND t2.status != 'completed'
          )
      ) as live_workers,
      (
        SELECT COUNT(t3.id)::int
        FROM tasks t3
        JOIN cleaners c2 ON c2.id = t3.cleaner_id
        WHERE c2.supervisor_id = (SELECT id FROM supervisors WHERE user_id = $1)
          AND t3.status != 'completed'
      ) as pending_jobs,
      (
        SELECT COALESCE(SUM(COALESCE(t4.final_price, t4.task_amount, 0)), 0)::float
        FROM tasks t4
        JOIN cleaners c3 ON c3.id = t4.cleaner_id
        JOIN supervisors s2 ON c3.supervisor_id = s2.id
        WHERE s2.user_id = $1
          AND t4.status = 'completed'
          AND ${toIST('t4.completed_at')}::date = ${IST_DATE_EXPR} - interval '1 day'
      ) as yesterday_earnings
    FROM tasks t
    JOIN cleaners c ON c.id = t.cleaner_id
    JOIN supervisors s ON c.supervisor_id = s.id
    LEFT JOIN reviews r ON r.task_id = t.id
    WHERE s.user_id = $1
      AND t.status = 'completed'
      AND ${toIST('t.completed_at')}::date = ${IST_DATE_EXPR}
    `, [supervisorUserId]);
    const summary = result.rows[0];
    if (!summary)
        return null;
    const earnings_growth = summary.yesterday_earnings > 0
        ? parseFloat((((summary.total_earnings - summary.yesterday_earnings) / summary.yesterday_earnings) *
            100).toFixed(1))
        : summary.total_earnings > 0
            ? 100
            : 0;
    return {
        ...summary,
        earnings_growth,
    };
};
exports.getSupervisorDashboardSummaryService = getSupervisorDashboardSummaryService;
// Get supervisor details (your existing code)
const getSupervisorDetailsService = async (supervisorId) => {
    try {
        const query = `
      SELECT 
        s.id AS supervisor_id,
        s.full_name AS supervisor_full_name,
        s.is_active,

        su.email AS supervisor_email,
        su.phone AS supervisor_phone,
        su.base_salary AS supervisor_base_salary,
        su.nationality,
        su.document_id,
        su.profile_image,
        su.age,
        su.document,
        su.joining_date,

        b.id AS building_id,
        b.building_name,

        c.id AS cleaner_id,
        c.cleaner_full_name,
        c.incentive_target,
        c.total_tasks,
        c.total_earning,
        
        cu.email AS cleaner_email,
        cu.base_salary AS cleaner_base_salary,

        f.id AS floor_id,
        f.floor_number

      FROM supervisors s
      JOIN users su ON s.user_id = su.id
      LEFT JOIN buildings b ON s.building_id = b.id
      LEFT JOIN cleaners c ON c.supervisor_id = s.id
      LEFT JOIN users cu ON c.user_id = cu.id
      LEFT JOIN floors f ON c.floor_id = f.id
      WHERE s.id = $1
    `;
        const result = await connectDatabase_1.pool.query(query, [supervisorId]);
        if (result.rows.length === 0) {
            return null;
        }
        const supervisorRow = result.rows[0];
        // Group cleaners and avoid duplicates
        const cleanersMap = new Map();
        result.rows.forEach((row) => {
            if (row.cleaner_id && !cleanersMap.has(row.cleaner_id)) {
                cleanersMap.set(row.cleaner_id, {
                    id: row.cleaner_id,
                    full_name: row.cleaner_full_name,
                    email: row.cleaner_email,
                    total_tasks: Number(row.total_tasks) || 0,
                    total_earning: Number(row.total_earning) || 0,
                    base_salary: Number(row.cleaner_base_salary) || 0,
                    incentive_target: Number(row.incentive_target) || 0,
                    floor: row.floor_id
                        ? {
                            id: row.floor_id,
                            floor_number: row.floor_number,
                        }
                        : null,
                });
            }
        });
        const cleaners = Array.from(cleanersMap.values());
        return {
            id: supervisorRow.supervisor_id,
            full_name: supervisorRow.supervisor_full_name,
            email: supervisorRow.supervisor_email,
            phone: supervisorRow.supervisor_phone,
            base_salary: Number(supervisorRow.supervisor_base_salary) || 0,
            nationality: supervisorRow.nationality,
            document_id: supervisorRow.document_id,
            profile_image: supervisorRow.profile_image,
            age: supervisorRow.age,
            document: supervisorRow.document,
            joining_date: supervisorRow.joining_date,
            is_active: supervisorRow.is_active,
            building: supervisorRow.building_id
                ? {
                    id: supervisorRow.building_id,
                    name: supervisorRow.building_name,
                }
                : null,
            cleaners,
        };
    }
    catch (error) {
        console.error('Database error in getSupervisorDetailsService:', error);
        throw error;
    }
};
exports.getSupervisorDetailsService = getSupervisorDetailsService;
// Update supervisor
const updateSupervisorService = async (supervisorId, updateData) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // First, get the supervisor's user_id
        const supervisorQuery = await client.query('SELECT user_id, building_id FROM supervisors WHERE id = $1', [supervisorId]);
        if (supervisorQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const { user_id, building_id: currentBuildingId } = supervisorQuery.rows[0];
        // Check if building exists if building_id is being updated
        if (updateData.building_id && updateData.building_id !== currentBuildingId) {
            const buildingCheck = await client.query('SELECT id FROM buildings WHERE id = $1', [
                updateData.building_id,
            ]);
            if (buildingCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Building not found');
            }
        }
        // Check if email is being changed and if it already exists
        if (updateData.email) {
            const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [
                updateData.email,
                user_id,
            ]);
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                throw new Error('Email already exists');
            }
        }
        // Build dynamic update query for users table
        const userUpdates = [];
        const userValues = [];
        let userParamCount = 1;
        if (updateData.full_name !== undefined) {
            userUpdates.push(`full_name = $${userParamCount++}`);
            userValues.push(updateData.full_name);
        }
        if (updateData.email !== undefined) {
            userUpdates.push(`email = $${userParamCount++}`);
            userValues.push(updateData.email);
        }
        if (updateData.phone !== undefined) {
            userUpdates.push(`phone = $${userParamCount++}`);
            userValues.push(updateData.phone);
        }
        if (updateData.age !== undefined) {
            userUpdates.push(`age = $${userParamCount++}`);
            userValues.push(updateData.age);
        }
        if (updateData.nationality !== undefined) {
            userUpdates.push(`nationality = $${userParamCount++}`);
            userValues.push(updateData.nationality);
        }
        if (updateData.document_id !== undefined) {
            userUpdates.push(`document_id = $${userParamCount++}`);
            userValues.push(updateData.document_id);
        }
        if (updateData.document !== undefined) {
            userUpdates.push(`document = $${userParamCount++}`);
            userValues.push(updateData.document);
        }
        if (updateData.base_salary !== undefined) {
            userUpdates.push(`base_salary = $${userParamCount++}`);
            userValues.push(updateData.base_salary);
        }
        if (updateData.profile_image !== undefined) {
            userUpdates.push(`profile_image = $${userParamCount++}`);
            userValues.push(updateData.profile_image);
        }
        if (updateData.building_id !== undefined) {
            userUpdates.push(`building_id = $${userParamCount++}`);
            userValues.push(updateData.building_id);
        }
        if (updateData.password !== undefined) {
            // Hash password before storing (use bcrypt in production)
            const hashedPassword = await bcrypt_1.default.hash(updateData.password, 10);
            userUpdates.push(`password = $${userParamCount++}`);
            userValues.push(hashedPassword);
        }
        // Always update updated_at
        userUpdates.push(`updated_at = NOW()`);
        // Update users table if there are changes
        if (userUpdates.length > 1) {
            // More than just updated_at
            userValues.push(user_id);
            const userUpdateQuery = `
        UPDATE users 
        SET ${userUpdates.join(', ')}
        WHERE id = $${userParamCount}
        RETURNING *
      `;
            await client.query(userUpdateQuery, userValues);
        }
        // Update supervisors table if building_id changed
        if (updateData.building_id !== undefined) {
            await client.query(`UPDATE supervisors 
         SET building_id = $1, updated_at = NOW()
         WHERE id = $2`, [updateData.building_id, supervisorId]);
        }
        // Update supervisor's full_name in supervisors table if changed
        if (updateData.full_name !== undefined) {
            await client.query(`UPDATE supervisors 
         SET full_name = $1, updated_at = NOW()
         WHERE id = $2`, [updateData.full_name, supervisorId]);
        }
        await client.query('COMMIT');
        // Return updated supervisor details
        return await (0, exports.getSupervisorDetailsService)(supervisorId);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error in updateSupervisorService:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.updateSupervisorService = updateSupervisorService;
// Toggle supervisor active/inactive status
const toggleSupervisorStatusService = async (supervisorId, isActive) => {
    try {
        const query = `
      UPDATE supervisors 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, is_active
    `;
        const result = await connectDatabase_1.pool.query(query, [isActive, supervisorId]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Database error in toggleSupervisorStatusService:', error);
        throw error;
    }
};
exports.toggleSupervisorStatusService = toggleSupervisorStatusService;
// Delete supervisor
const deleteSupervisorService = async (supervisorId) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Check if supervisor has assigned cleaners
        const cleanersCheck = await client.query('SELECT COUNT(*) as count FROM cleaners WHERE supervisor_id = $1', [supervisorId]);
        if (parseInt(cleanersCheck.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            throw new Error('Supervisor has assigned cleaners');
        }
        // Get the user_id before deleting supervisor
        const supervisorQuery = await client.query('SELECT user_id FROM supervisors WHERE id = $1', [
            supervisorId,
        ]);
        if (supervisorQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const { user_id } = supervisorQuery.rows[0];
        // Delete from supervisors table
        await client.query('DELETE FROM supervisors WHERE id = $1', [supervisorId]);
        // Delete from users table
        await client.query('DELETE FROM users WHERE id = $1', [user_id]);
        await client.query('COMMIT');
        return { success: true };
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error in deleteSupervisorService:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.deleteSupervisorService = deleteSupervisorService;
// Get detailed analytics for supervisor
const getSupervisorAnalyticsService = async (supervisorUserId) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        // Helper to get totals and car type breakdown for a period
        // IST-safe date/time helpers for analytics period filters
        const IST_DATE_EXPR = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date`;
        const IST_TS_EXPR = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')`;
        const toIST = (col) => `(${col} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')`;
        const getDataForPeriod = async (periodFilter) => {
            // FIX #2 (Analytics side) + #4: Use COALESCE(final_price, task_amount) for consistency with Dashboard.
            // This ensures Analytics and Dashboard always show the same earnings numbers.
            const overview = await client.query(`SELECT 
          COALESCE(SUM(COALESCE(t.final_price, t.task_amount, 0)), 0)::float as total_earnings,
          COUNT(t.id)::int as total_jobs
         FROM tasks t
         JOIN cleaners c ON t.cleaner_id = c.id
         JOIN supervisors s ON c.supervisor_id = s.id
         WHERE s.user_id = $1 AND t.status = 'completed' AND ${periodFilter}`, [supervisorUserId]);
            const carTypeBreakdown = await client.query(`SELECT 
          t.car_type as type,
          COUNT(*)::int as count,
          COALESCE(SUM(COALESCE(t.final_price, t.task_amount, 0)), 0)::float as amount
         FROM tasks t
         JOIN cleaners c ON t.cleaner_id = c.id
         JOIN supervisors s ON c.supervisor_id = s.id
         WHERE s.user_id = $1 AND t.status = 'completed' AND ${periodFilter}
         GROUP BY t.car_type
         ORDER BY count DESC`, [supervisorUserId]);
            return {
                total_earnings: overview.rows[0].total_earnings,
                total_jobs: overview.rows[0].total_jobs,
                carTypeBreakdown: carTypeBreakdown.rows,
            };
        };
        const dailyFilter = `${toIST('t.completed_at')}::date = ${IST_DATE_EXPR}`;
        const yesterdayFilter = `${toIST('t.completed_at')}::date = ${IST_DATE_EXPR} - interval '1 day'`;
        const weeklyFilter = `${toIST('t.completed_at')} >= date_trunc('week', ${IST_TS_EXPR})`;
        const lastWeekFilter = `${toIST('t.completed_at')} >= date_trunc('week', ${IST_TS_EXPR}) - interval '1 week' AND ${toIST('t.completed_at')} < date_trunc('week', ${IST_TS_EXPR})`;
        const monthlyFilter = `${toIST('t.completed_at')} >= date_trunc('month', ${IST_TS_EXPR})`;
        const lastMonthFilter = `${toIST('t.completed_at')} >= date_trunc('month', ${IST_TS_EXPR}) - interval '1 month' AND ${toIST('t.completed_at')} < date_trunc('month', ${IST_TS_EXPR})`;
        const getEnhancedDataForPeriod = async (currentFilter, previousFilter) => {
            const current = await getDataForPeriod(currentFilter);
            const previous = await getDataForPeriod(previousFilter);
            const calculateGrowth = (curr, prev) => {
                if (prev === 0)
                    return curr > 0 ? 100 : 0;
                return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
            };
            return {
                ...current,
                earnings_growth: calculateGrowth(current.total_earnings, previous.total_earnings),
                jobs_growth: calculateGrowth(current.total_jobs, previous.total_jobs),
            };
        };
        const daily = await getEnhancedDataForPeriod(dailyFilter, yesterdayFilter);
        const weekly = await getEnhancedDataForPeriod(weeklyFilter, lastWeekFilter);
        const monthly = await getEnhancedDataForPeriod(monthlyFilter, lastMonthFilter);
        // Weekly Performance (Last 7 Days) for the chart
        const weeklyPerformance = await client.query(`SELECT 
        TO_CHAR(d.day, 'Dy') as day,
        TO_CHAR(d.day, 'YYYY-MM-DD') as date,
        COALESCE(COUNT(t.id), 0)::int as tasks
       FROM (
         SELECT generate_series(CURRENT_DATE - interval '6 days', CURRENT_DATE, '1 day')::date as day
       ) d
       LEFT JOIN tasks t ON DATE(t.completed_at) = d.day 
         AND t.status = 'completed'
         AND t.cleaner_id IN (
           SELECT id FROM cleaners WHERE supervisor_id = (SELECT id FROM supervisors WHERE user_id = $1)
         )
       GROUP BY d.day
       ORDER BY d.day`, [supervisorUserId]);
        // Task Breakdown (Overall/Monthly)
        const taskBreakdown = await client.query(`SELECT 
        status,
        COUNT(*)::int as count
       FROM tasks t
       JOIN cleaners c ON t.cleaner_id = c.id
       JOIN supervisors s ON c.supervisor_id = s.id
       WHERE s.user_id = $1
         AND (
           (t.status = 'completed' AND t.completed_at >= date_trunc('month', CURRENT_DATE))
           OR t.status != 'completed'
         )
       GROUP BY status`, [supervisorUserId]);
        return {
            daily,
            weekly,
            monthly,
            weeklyPerformance: weeklyPerformance.rows,
            taskBreakdown: taskBreakdown.rows,
        };
    }
    finally {
        client.release();
    }
};
exports.getSupervisorAnalyticsService = getSupervisorAnalyticsService;
