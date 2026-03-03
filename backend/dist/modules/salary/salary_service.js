"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyReport = exports.getRoleBasedSalaries = exports.getSalaryTimeline = exports.getSalariesByUserId = exports.getSalariesByCycleId = exports.getSalarySummary = exports.previewSalaryForCleaner = exports.markSalaryAsPaid = exports.lockSalaryCycle = exports.getAllSalaries = exports.getAllSalaryCycles = exports.generateSalaryForAllUsers = exports.generateSalaryForUser = void 0;
// src/services/salary_service.ts
const connectDatabase_1 = require("../../database/connectDatabase");
const generateSalaryForUser = async (userId, cycleId) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1️⃣ Get cycle
        const cycleRes = await client.query(`SELECT start_date, end_date, is_locked
       FROM salary_cycles
       WHERE id = $1`, [cycleId]);
        if (!cycleRes.rowCount)
            throw new Error('CYCLE_NOT_FOUND');
        const cycle = cycleRes.rows[0];
        if (cycle.is_locked)
            throw new Error('SALARY_CYCLE_LOCKED');
        const { start_date, end_date } = cycle;
        // 2️⃣ Get user
        const userRes = await client.query(`SELECT id, role, base_salary FROM users WHERE id = $1`, [
            userId,
        ]);
        if (!userRes.rowCount)
            throw new Error('USER_NOT_FOUND');
        const user = userRes.rows[0];
        // ❌ Skip SuperAdmin
        if (user.role === 'superAdmin') {
            await client.query('ROLLBACK');
            return null;
        }
        let totalTasks = 0;
        let totalIncentives = 0;
        let totalPenalties = 0;
        // 3️⃣ Role-based calculations
        if (user.role === 'cleaner') {
            // Get cleaner profile
            const cleanerRes = await client.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);
            if (!cleanerRes.rowCount)
                throw new Error('CLEANER_PROFILE_NOT_FOUND');
            const cleanerProfileId = cleanerRes.rows[0].id;
            // Tasks
            const taskRes = await client.query(`SELECT COUNT(*) AS total_tasks FROM tasks
         WHERE cleaner_id = $1 AND status = 'completed'
         AND created_at BETWEEN $2 AND $3`, [cleanerProfileId, start_date, end_date]);
            totalTasks = Number(taskRes.rows[0].total_tasks);
            // 1. Performance Incentives (from daily_incentive_breakdown)
            const perfRes = await client.query(`SELECT COALESCE(SUM(dib.amount), 0) AS total
         FROM daily_work_records dwr
         JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
         WHERE dwr.cleaner_id = $1 AND dwr.date BETWEEN $2 AND $3`, [cleanerProfileId, start_date, end_date]);
            // 2. Milestone Achievements
            const milRes = await client.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM milestone_achievements
         WHERE cleaner_id = $1 AND achieved_at BETWEEN $2 AND $3`, [cleanerProfileId, start_date, end_date]);
            // 3. Manual Cleaner Incentives
            const manRes = await client.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM cleaner_incentives
         WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3`, [cleanerProfileId, start_date, end_date]);
            totalIncentives =
                Number(perfRes.rows[0].total) +
                    Number(milRes.rows[0].total) +
                    Number(manRes.rows[0].total);
            // Penalties
            const penaltyRes = await client.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM penalties
         WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3`, [cleanerProfileId, start_date, end_date]);
            totalPenalties = Number(penaltyRes.rows[0].total);
        }
        else {
            // For supervisors and other roles, incentives/penalties are disabled
            totalTasks = 0;
            totalIncentives = 0;
            totalPenalties = 0;
        }
        // 4️⃣ Final Values
        const baseSalary = Number(user.base_salary);
        const netSalary = baseSalary + totalIncentives - totalPenalties;
        const salaryRes = await client.query(`INSERT INTO salaries (
        cleaner_id, salary_cycle_id, base_salary, total_tasks,
        total_incentives, total_penalties, gross_salary, net_salary, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      ON CONFLICT (cleaner_id, salary_cycle_id)
      DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        total_tasks = EXCLUDED.total_tasks,
        total_incentives = EXCLUDED.total_incentives,
        total_penalties = EXCLUDED.total_penalties,
        gross_salary = EXCLUDED.gross_salary,
        net_salary = EXCLUDED.net_salary,
        status = CASE WHEN salaries.status = 'paid' THEN 'paid' ELSE 'pending' END
      RETURNING *`, [userId, cycleId, baseSalary, totalTasks, totalIncentives, totalPenalties, netSalary, netSalary]);
        await client.query('COMMIT');
        return salaryRes.rows[0];
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
};
exports.generateSalaryForUser = generateSalaryForUser;
const generateSalaryForAllUsers = async (cycleId) => {
    const usersRes = await connectDatabase_1.pool.query(`SELECT id FROM users WHERE role != 'superAdmin'`);
    const users = usersRes.rows;
    const results = [];
    for (const user of users) {
        const salary = await (0, exports.generateSalaryForUser)(user.id, cycleId);
        if (salary)
            results.push(salary);
    }
    return results;
};
exports.generateSalaryForAllUsers = generateSalaryForAllUsers;
const getAllSalaryCycles = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT id, month, year, start_date, end_date, is_locked
    FROM salary_cycles
    ORDER BY year DESC, month DESC
  `);
    return result.rows;
};
exports.getAllSalaryCycles = getAllSalaryCycles;
/* ================= GET ALL SALARIES ================= */
const getAllSalaries = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT
      s.id,
      s.cleaner_id                                        AS user_id,
      u.full_name,
      u.role,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month,
      s.base_salary,
      s.total_incentives                                  AS incentive_amount,
      s.total_penalties                                   AS penalty_amount,
      s.net_salary                                        AS final_salary,
      s.status
    FROM salaries s
    JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    JOIN users u ON u.id = s.cleaner_id
    ORDER BY sc.year DESC, sc.month DESC, u.full_name ASC
  `);
    return result.rows;
};
exports.getAllSalaries = getAllSalaries;
const lockSalaryCycle = async (cycleId) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1️⃣ Check cycle exists
        const cycleRes = await client.query(`SELECT id, is_locked FROM salary_cycles WHERE id = $1`, [
            cycleId,
        ]);
        if (!cycleRes.rowCount) {
            throw new Error('CYCLE_NOT_FOUND');
        }
        if (cycleRes.rows[0].is_locked) {
            throw new Error('SALARY_ALREADY_LOCKED');
        }
        // 2️⃣ Ensure salaries exist
        const salaryRes = await client.query(`SELECT COUNT(*) FROM salaries WHERE salary_cycle_id = $1`, [cycleId]);
        if (Number(salaryRes.rows[0].count) === 0) {
            throw new Error('NO_SALARIES_GENERATED');
        }
        // 3️⃣ Lock salary cycle
        await client.query(`
      UPDATE salary_cycles
      SET is_locked = true,
          locked_at = now()
      WHERE id = $1
      `, [cycleId]);
        // 4️⃣ Update salary status
        await client.query(`
      UPDATE salaries
      SET status = 'locked',
          finalized_at = now()
      WHERE salary_cycle_id = $1
      `, [cycleId]);
        await client.query('COMMIT');
        return { message: 'Salary cycle locked successfully' };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
};
exports.lockSalaryCycle = lockSalaryCycle;
const markSalaryAsPaid = async (salaryId, paymentMethod) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        const salaryRes = await client.query(`SELECT id, status FROM salaries WHERE id = $1`, [
            salaryId,
        ]);
        if (!salaryRes.rowCount) {
            throw new Error('SALARY_NOT_FOUND');
        }
        if (salaryRes.rows[0].status !== 'locked') {
            throw new Error('SALARY_MUST_BE_LOCKED_BEFORE_PAYMENT');
        }
        const updateRes = await client.query(`
      UPDATE salaries
      SET status = 'paid',
          paid_at = now(),
          payment_method = $2
      WHERE id = $1
      RETURNING *
      `, [salaryId, paymentMethod || null]);
        await client.query('COMMIT');
        return updateRes.rows[0];
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
};
exports.markSalaryAsPaid = markSalaryAsPaid;
const previewSalaryForCleaner = async (cleanerId, cycleId) => {
    const cycleRes = await connectDatabase_1.pool.query(`SELECT start_date, end_date FROM salary_cycles WHERE id = $1`, [cycleId]);
    if (!cycleRes.rowCount)
        throw new Error('CYCLE_NOT_FOUND');
    const { start_date, end_date } = cycleRes.rows[0];
    const baseRes = await connectDatabase_1.pool.query(`SELECT base_salary FROM cleaners WHERE id = $1`, [cleanerId]);
    const incentiveRes = await connectDatabase_1.pool.query(`
    SELECT COALESCE(SUM(amount),0) AS total
    FROM cleaner_incentives
    WHERE cleaner_id = $1
    AND created_at BETWEEN $2 AND $3
    `, [cleanerId, start_date, end_date]);
    const penaltyRes = await connectDatabase_1.pool.query(`
    SELECT COALESCE(SUM(amount),0) AS total
    FROM penalties
    WHERE cleaner_id = $1
    AND created_at BETWEEN $2 AND $3
    `, [cleanerId, start_date, end_date]);
    const base = Number(baseRes.rows[0].base_salary);
    const incentive = Number(incentiveRes.rows[0].total);
    const penalty = Number(penaltyRes.rows[0].total);
    return {
        base_salary: base,
        total_incentives: incentive,
        total_penalties: penalty,
        net_salary: base + incentive - penalty,
    };
};
exports.previewSalaryForCleaner = previewSalaryForCleaner;
const getSalarySummary = async (mode) => {
    let dateCondition = '';
    if (mode === 'daily') {
        dateCondition = 'DATE(t.created_at) = CURRENT_DATE';
    }
    else if (mode === 'weekly') {
        dateCondition = "DATE_TRUNC('week', t.created_at) = DATE_TRUNC('week', CURRENT_DATE)";
    }
    else {
        dateCondition = "DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)";
    }
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id AS cleaner_id,
      u.full_name,
      COUNT(t.id) AS total_tasks,
      COALESCE(SUM(ci.amount),0) AS total_incentives,
      COALESCE(SUM(p.amount),0) AS total_penalties,
      COALESCE(SUM(t.amount_charged),0) AS total_collections
    FROM users u
    LEFT JOIN cleaners c ON c.user_id = u.id
    LEFT JOIN tasks t ON t.cleaner_id = c.id
      AND ${dateCondition}
    LEFT JOIN cleaner_incentives ci ON ci.cleaner_id = c.id
      AND ${dateCondition.replace('t.created_at', 'ci.created_at')}
    LEFT JOIN penalties p ON p.cleaner_id = c.id
      AND ${dateCondition.replace('t.created_at', 'p.created_at')}
    WHERE u.role = 'cleaner'
    GROUP BY u.id, u.full_name
  `);
    return result.rows;
};
exports.getSalarySummary = getSalarySummary;
const getSalariesByCycleId = async (cycleId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      u.id              AS user_id,
      u.full_name       AS cleaner_name,
      u.role            AS role,
      COALESCE(s.base_salary, u.base_salary, 0) AS base_salary,
      CASE 
        WHEN u.role = 'cleaner' THEN COALESCE(s.total_incentives, 0)
        ELSE 0 
      END AS total_incentives,
      CASE 
        WHEN u.role = 'cleaner' THEN COALESCE(s.total_penalties, 0)
        ELSE 0 
      END AS total_penalties,
      COALESCE(s.net_salary, COALESCE(s.base_salary, u.base_salary, 0)) AS net_salary,
      COALESCE(s.status, 'not_generated') AS status,
      s.id              AS id
    FROM users u
    LEFT JOIN salaries s ON s.cleaner_id = u.id AND s.salary_cycle_id = $1
    WHERE u.role IN ('cleaner', 'supervisor')
    ORDER BY u.full_name ASC
    `, [cycleId]);
    return result.rows;
};
exports.getSalariesByCycleId = getSalariesByCycleId;
const getSalariesByUserId = async (userId) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      s.id,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month,
      s.base_salary,
      s.total_incentives AS incentive_amount,
      s.total_penalties AS penalty_amount,
      s.net_salary AS final_salary,
      s.status,
      s.created_at,
      u.role
    FROM salaries s
    JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    JOIN users u ON u.id = s.cleaner_id
    WHERE s.cleaner_id = $1
    ORDER BY sc.year DESC, sc.month DESC
    `, [userId]);
    return result.rows;
};
exports.getSalariesByUserId = getSalariesByUserId;
/* ================= SALARY TIMELINE (mobile calendar view) ================= */
const getSalaryTimeline = async (userId) => {
    const userRes = await connectDatabase_1.pool.query(`SELECT u.id, u.role, u.base_salary,
            COALESCE(u.joining_date, u.created_at) AS joining_date
     FROM users u
     WHERE u.id = $1`, [userId]);
    if (!userRes.rowCount)
        throw new Error('USER_NOT_FOUND');
    const user = userRes.rows[0];
    // Always try to find a cleaners row — incentives/penalties are keyed on cleaners.id
    let cleanerId = null;
    const cRes = await connectDatabase_1.pool.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);
    if (cRes.rowCount)
        cleanerId = cRes.rows[0].id;
    const salaryRes = await connectDatabase_1.pool.query(`SELECT s.id, sc.year, sc.month, s.base_salary, s.total_incentives,
            s.total_penalties, s.net_salary, s.status, sc.is_locked
     FROM salaries s
     JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
     WHERE s.cleaner_id = $1`, [userId]);
    const salaryMap = new Map();
    for (const row of salaryRes.rows) {
        salaryMap.set(`${row.year}-${String(row.month).padStart(2, '0')}`, row);
    }
    const joiningDate = new Date(user.joining_date);
    const now = new Date();
    const timeline = [];
    let cursor = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    const endCursor = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor <= endCursor) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        // Use open-ended range: >= first day of month AND < first day of NEXT month
        // This reliably captures every record regardless of timestamp precision
        const monthStart = new Date(year, month - 1, 1); // e.g. 2025-02-01 00:00:00
        const nextMonthStart = new Date(year, month, 1); // e.g. 2025-03-01 00:00:00
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
        let liveIncentives = 0;
        let livePenalties = 0;
        if (cleanerId) {
            // 1. Performance (Daily)
            const perfRes = await connectDatabase_1.pool.query(`SELECT COALESCE(SUM(dib.amount), 0) AS total
         FROM daily_work_records dwr
         JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
         WHERE dwr.cleaner_id = $1 AND dwr.date >= $2::date AND dwr.date < $3::date`, [cleanerId, monthStart, nextMonthStart]);
            // 2. Milestones
            const milRes = await connectDatabase_1.pool.query(`SELECT COALESCE(SUM(amount), 0) AS total 
         FROM milestone_achievements
         WHERE cleaner_id = $1 AND achieved_at >= $2 AND achieved_at < $3`, [cleanerId, monthStart, nextMonthStart]);
            // 3. Manual/Other
            const manRes = await connectDatabase_1.pool.query(`SELECT COALESCE(SUM(amount), 0) AS total 
         FROM cleaner_incentives
         WHERE cleaner_id = $1 AND created_at >= $2 AND created_at < $3`, [cleanerId, monthStart, nextMonthStart]);
            liveIncentives = Number(perfRes.rows[0].total) + Number(milRes.rows[0].total) + Number(manRes.rows[0].total);
            // Penalties stay on the penalties table (keyed by cleaner_id)
            const pRes = await connectDatabase_1.pool.query(`SELECT COALESCE(SUM(amount), 0) AS total
         FROM penalties
         WHERE cleaner_id = $1
           AND created_at >= $2
           AND created_at <  $3`, [cleanerId, monthStart, nextMonthStart]);
            livePenalties = Number(pRes.rows[0].total);
        }
        const existing = salaryMap.get(key);
        const baseSalary = existing ? Number(existing.base_salary) : (Number(user.base_salary) || 0);
        const finalSalary = baseSalary + liveIncentives - livePenalties;
        timeline.push({
            salary_month: key,
            year,
            month,
            base_salary: baseSalary,
            incentive_amount: liveIncentives,
            penalty_amount: livePenalties,
            final_salary: finalSalary,
            status: existing
                ? (existing.is_locked ? 'locked' : existing.status)
                : (isCurrentMonth ? 'in_progress' : 'pending'),
            is_current_month: isCurrentMonth,
            salary_id: existing?.id ?? null,
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return timeline.reverse();
};
exports.getSalaryTimeline = getSalaryTimeline;
/**
 * Role-based salary summary for the web admin dashboard.
 * Returns all salary records (or filtered by cycle) with full user, role,
 * and building context for a role-wise split table.
 */
const getRoleBasedSalaries = async (cycleId) => {
    const params = [];
    let cycleFilter = '';
    if (cycleId) {
        cycleFilter = 'AND s.salary_cycle_id = $1';
        params.push(cycleId);
    }
    const result = await connectDatabase_1.pool.query(`SELECT
      u.id              AS user_id,
      u.full_name,
      u.role,
      u.email,
      COALESCE(b_c.building_name, b_s.building_name, 'N/A') AS building_name,
      COALESCE(s.base_salary, u.base_salary, 0) AS base_salary,
      CASE 
        WHEN u.role = 'cleaner' THEN COALESCE(s.total_incentives, 0)
        ELSE 0 
      END AS total_incentives,
      CASE 
        WHEN u.role = 'cleaner' THEN COALESCE(s.total_penalties, 0)
        ELSE 0 
      END AS total_penalties,
      COALESCE(s.total_tasks, 0) AS total_tasks,
      COALESCE(s.net_salary, COALESCE(s.base_salary, u.base_salary, 0)) AS net_salary,
      COALESCE(s.status, 'not_generated') AS status,
      s.id AS salary_id,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month
    FROM users u
    LEFT JOIN cleaners cl ON cl.user_id = u.id
    LEFT JOIN buildings b_c ON b_c.id = cl.building_id
    LEFT JOIN supervisors sv ON sv.user_id = u.id
    LEFT JOIN buildings b_s ON b_s.id = sv.building_id
    LEFT JOIN salaries s ON s.cleaner_id = u.id ${cycleFilter}
    LEFT JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    WHERE u.role IN ('cleaner', 'supervisor')
    ORDER BY u.role, u.full_name`, params);
    return result.rows;
};
exports.getRoleBasedSalaries = getRoleBasedSalaries;
/**
 * Monthly Report Summary for the Accountant Dashboard.
 * Returns aggregated totals per month and per building for the latest cycle.
 */
const getMonthlyReport = async () => {
    // 1. Monthly History (Last 12 cycles)
    const historyRes = await connectDatabase_1.pool.query(`
    SELECT
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS month_key,
      SUM(s.base_salary) as base_salary,
      SUM(s.total_incentives) as incentives,
      SUM(s.total_penalties) as penalties,
      SUM(s.net_salary) as net_payout,
      CASE WHEN sc.is_locked THEN 'finalized' ELSE 'current' END as status
    FROM salaries s
    JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    GROUP BY sc.year, sc.month, sc.is_locked, sc.id
    ORDER BY sc.year DESC, sc.month DESC
    LIMIT 12
  `);
    // 2. Building Breakdown (Latest Cycle)
    const buildingRes = await connectDatabase_1.pool.query(`
    WITH latest_cycle AS (
      SELECT id FROM salary_cycles ORDER BY year DESC, month DESC LIMIT 1
    )
    SELECT
      b.id,
      b.building_name as name,
      COUNT(DISTINCT s.cleaner_id)::int as cleaners_count,
      SUM(s.net_salary) as total_salary,
      SUM(s.total_incentives) as incentives,
      SUM(s.total_penalties) as penalties
    FROM salaries s
    JOIN latest_cycle lc ON s.salary_cycle_id = lc.id
    JOIN cleaners cl ON cl.user_id = s.cleaner_id
    JOIN buildings b ON b.id = cl.building_id
    GROUP BY b.id, b.building_name
  `);
    return {
        history: historyRes.rows,
        buildings: buildingRes.rows,
    };
};
exports.getMonthlyReport = getMonthlyReport;
