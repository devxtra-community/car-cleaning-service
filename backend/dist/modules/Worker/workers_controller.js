"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCleanerFullDetailsController = exports.getWorkerTaskLogs = exports.getWorkerWalletStats = exports.getWorkerPenalties = exports.getWorkerDashboard = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const worker_service_1 = require("./worker_service");
/**
 * Helper: returns the cleaner_id for a given user_id.
 * If no cleaners row exists yet, it auto-creates one so the
 * worker app never receives a confusing 404 on first use.
 */
async function getOrCreateCleanerId(userId) {
    const existing = await connectDatabase_1.pool.query('SELECT id FROM cleaners WHERE user_id = $1', [userId]);
    if (existing.rows.length)
        return existing.rows[0].id;
    // Auto-create a minimal cleaners record linked to this user.
    // ON CONFLICT DO NOTHING handles the race condition if two requests arrive at the same time.
    await connectDatabase_1.pool.query(`INSERT INTO cleaners (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
    // Re-fetch after the insert (handles both success and conflict cases)
    const after = await connectDatabase_1.pool.query('SELECT id FROM cleaners WHERE user_id = $1', [userId]);
    if (after.rows.length)
        return after.rows[0].id;
    throw new Error('Failed to create or find cleaners record for this worker');
}
const getWorkerDashboard = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        const { range = 'day', date } = req.query; // 'day' | 'week' | 'month'
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Calculate dates based on range
        const selectedDate = date ? new Date(date) : new Date();
        let dateCondition = '';
        if (range === 'week') {
            dateCondition = `AND t2.completed_at >= date_trunc('week', $2::date) AND t2.completed_at < date_trunc('week', $2::date) + interval '1 week'`;
        }
        else if (range === 'month') {
            dateCondition = `AND t2.completed_at >= date_trunc('month', $2::date) AND t2.completed_at < date_trunc('month', $2::date) + interval '1 month'`;
        }
        else {
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
        u.email,
        u.phone as phone_number,
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
          SELECT COALESCE(SUM(dib_d.amount), 0)::float
          FROM daily_work_records dwr_d
          LEFT JOIN daily_incentive_breakdown dib_d ON dwr_d.id = dib_d.daily_work_record_id
          WHERE dwr_d.cleaner_id = c.id
            AND dwr_d.date = $2::date
        ) + (
          SELECT COALESCE(SUM(ci_d.amount), 0)::float
          FROM cleaner_incentives ci_d
          WHERE ci_d.cleaner_id = c.id
            AND ci_d.created_at::date = $2::date
        ) as incentive_day,
        (
          SELECT COALESCE(SUM(dib_w.amount), 0)::float
          FROM daily_work_records dwr_w
          LEFT JOIN daily_incentive_breakdown dib_w ON dwr_w.id = dib_w.daily_work_record_id
          WHERE dwr_w.cleaner_id = c.id
            AND dwr_w.date >= date_trunc('week', $2::date)::date
            AND dwr_w.date < (date_trunc('week', $2::date) + interval '1 week')::date
        ) + (
          SELECT COALESCE(SUM(ci_w.amount), 0)::float
          FROM cleaner_incentives ci_w
          WHERE ci_w.cleaner_id = c.id
            AND ci_w.created_at >= date_trunc('week', $2::date)
            AND ci_w.created_at < date_trunc('week', $2::date) + interval '1 week'
        ) as incentive_week,
        (
          SELECT COALESCE(SUM(dib_m.amount), 0)::float
          FROM daily_work_records dwr_m
          LEFT JOIN daily_incentive_breakdown dib_m ON dwr_m.id = dib_m.daily_work_record_id
          WHERE dwr_m.cleaner_id = c.id
            AND dwr_m.date >= date_trunc('month', $2::date)::date
            AND dwr_m.date < (date_trunc('month', $2::date) + interval '1 month')::date
        ) + (
          SELECT COALESCE(SUM(ci_m.amount), 0)::float
          FROM cleaner_incentives ci_m
          WHERE ci_m.cleaner_id = c.id
            AND ci_m.created_at >= date_trunc('month', $2::date)
            AND ci_m.created_at < date_trunc('month', $2::date) + interval '1 month'
        ) as incentive_month,
        (
          SELECT COALESCE(SUM(ma.amount), 0)::float
          FROM milestone_achievements ma
          WHERE ma.cleaner_id = c.id
        ) as milestone_total
      FROM users u
      LEFT JOIN cleaners c ON c.user_id = u.id
      LEFT JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN users s_u ON s.user_id = s_u.id
      LEFT JOIN buildings b ON s.building_id = b.id
      WHERE u.id = $1
    `;
        const result = await connectDatabase_1.pool.query(query, [workerId, selectedDate]);
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }
        const data = result.rows[0];
        // Get active performance incentive rules to calculate progress
        const incentivesRes = await connectDatabase_1.pool.query(`
      SELECT ir.id, ir.rule_name, ir.base_amount, ir.criteria, ir.priority
      FROM incentive_rules ir
      JOIN incentive_types it ON ir.incentive_type_id = it.id
      WHERE ir.active = true 
        AND it.active = true
        AND it.category = 'performance'
      ORDER BY ir.priority ASC
      `);
        const periodJobs = data.period_jobs || 0;
        // Find next target based on performance rules
        let nextTarget = 10; // Default
        let incentiveAmount = 0;
        if (incentivesRes.rows.length > 0) {
            // Find the rule with the lowest target that hasn't been achieved yet
            const nextIncentive = incentivesRes.rows.find((rule) => rule.criteria.target_tasks > periodJobs);
            if (nextIncentive) {
                nextTarget = nextIncentive.criteria.target_tasks;
                incentiveAmount = nextIncentive.base_amount;
            }
            else {
                // All targets achieved, show the highest one
                const lastRule = incentivesRes.rows[incentivesRes.rows.length - 1];
                nextTarget = lastRule.criteria.target_tasks;
                incentiveAmount = lastRule.base_amount;
            }
        }
        // Calculate progress percentage
        const progress = Math.min((periodJobs / nextTarget) * 100, 100);
        return res.json({
            success: true,
            name: data.full_name,
            email: data.email,
            phone: data.phone_number,
            profilePhoto: null,
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
                milestones: data.milestone_total || 0,
            },
        });
    }
    catch (err) {
        console.error('DASHBOARD ERROR:', err);
        console.error('Stack:', err instanceof Error ? err.stack : 'No stack');
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Internal Server Error',
        });
    }
};
exports.getWorkerDashboard = getWorkerDashboard;
const getWorkerPenalties = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        const { period = 'week' } = req.query;
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const cleanerId = await getOrCreateCleanerId(workerId);
        let dateCondition = '';
        if (period === 'day') {
            dateCondition = `AND created_at::date = CURRENT_DATE`;
        }
        else if (period === 'week') {
            dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
        }
        else if (period === 'month') {
            dateCondition = `
        AND created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      `;
        }
        else {
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
        const result = await connectDatabase_1.pool.query(query, [cleanerId]);
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
    }
    catch (err) {
        console.error('GET PENALTIES ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};
exports.getWorkerPenalties = getWorkerPenalties;
const getWorkerWalletStats = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        const { range = 'day', date } = req.query;
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const cleanerId = await getOrCreateCleanerId(workerId);
        const selectedDate = date ? new Date(date) : new Date();
        let dateCondition = '';
        if (range === 'week') {
            dateCondition = `AND completed_at >= date_trunc('week', $2::date) AND completed_at < date_trunc('week', $2::date) + interval '1 week'`;
        }
        else if (range === 'month') {
            dateCondition = `AND completed_at >= date_trunc('month', $2::date) AND completed_at < date_trunc('month', $2::date) + interval '1 month'`;
        }
        else {
            dateCondition = `AND completed_at::date = $2::date`;
        }
        // 1. Tasks Details - Only fetching tasks as per requirement
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
        const tasksRes = await connectDatabase_1.pool.query(tasksQuery, [cleanerId, selectedDate]);
        // 2. Incentives Summary (Unified)
        const incentiveQuery = `
      SELECT COALESCE(SUM(amount), 0)::float as total
      FROM (
        SELECT amount FROM daily_incentive_breakdown dib
        JOIN daily_work_records dwr ON dib.daily_work_record_id = dwr.id
        WHERE dwr.cleaner_id = $1 AND dwr.date ${range === 'day'
            ? '= $2::date'
            : range === 'week'
                ? '>= date_trunc(\'week\', $2::date) AND dwr.date < date_trunc(\'week\', $2::date) + interval \'1 week\''
                : '>= date_trunc(\'month\', $2::date) AND dwr.date < date_trunc(\'month\', $2::date) + interval \'1 month\''}
        UNION ALL
        SELECT amount FROM milestone_achievements WHERE cleaner_id = $1 AND achieved_at ${range === 'day'
            ? '::date = $2::date'
            : range === 'week'
                ? '>= date_trunc(\'week\', $2::date) AND achieved_at < date_trunc(\'week\', $2::date) + interval \'1 week\''
                : '>= date_trunc(\'month\', $2::date) AND achieved_at < date_trunc(\'month\', $2::date) + interval \'1 month\''}
        UNION ALL
        SELECT amount FROM cleaner_incentives WHERE cleaner_id = $1 AND created_at ${range === 'day'
            ? '::date = $2::date'
            : range === 'week'
                ? '>= date_trunc(\'week\', $2::date) AND created_at < date_trunc(\'week\', $2::date) + interval \'1 week\''
                : '>= date_trunc(\'month\', $2::date) AND created_at < date_trunc(\'month\', $2::date) + interval \'1 month\''}
      ) as all_incentives
    `;
        const milestoneQuery = `
      SELECT COALESCE(SUM(amount), 0)::float as total FROM milestone_achievements 
      WHERE cleaner_id = $1 AND achieved_at ${range === 'day'
            ? '::date = $2::date'
            : range === 'week'
                ? '>= date_trunc(\'week\', $2::date) AND achieved_at < date_trunc(\'week\', $2::date) + interval \'1 week\''
                : '>= date_trunc(\'month\', $2::date) AND achieved_at < date_trunc(\'month\', $2::date) + interval \'1 month\''}
    `;
        const penaltyQuery = `
      SELECT COALESCE(SUM(amount), 0)::float as total FROM penalties 
      WHERE cleaner_id = $1 AND created_at ${range === 'day'
            ? '::date = $2::date'
            : range === 'week'
                ? '>= date_trunc(\'week\', $2::date) AND created_at < date_trunc(\'week\', $2::date) + interval \'1 week\''
                : '>= date_trunc(\'month\', $2::date) AND created_at < date_trunc(\'month\', $2::date) + interval \'1 month\''}
    `;
        const [incRes, milRes, penRes] = await Promise.all([
            connectDatabase_1.pool.query(incentiveQuery, [cleanerId, selectedDate]),
            connectDatabase_1.pool.query(milestoneQuery, [cleanerId, selectedDate]),
            connectDatabase_1.pool.query(penaltyQuery, [cleanerId, selectedDate]),
        ]);
        const incentiveTotal = incRes.rows[0].total;
        const milestoneTotal = milRes.rows[0].total;
        const penaltyTotal = penRes.rows[0].total;
        // Combine all transactions (Only tasks now)
        const transactions = [
            ...tasksRes.rows.map((t) => ({
                id: t.id,
                type: 'task',
                description: `Car wash - ${t.car_number}`,
                amount: t.amount,
                date: t.date,
                isCredit: true,
                car_number: t.car_number,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Calculate totals
        const taskTotal = tasksRes.rows.reduce((sum, t) => sum + t.amount, 0);
        return res.json({
            success: true,
            range,
            date: selectedDate,
            summary: {
                totalEarnings: taskTotal,
                taskCount: tasksRes.rows.length,
                taskTotal: taskTotal,
                incentiveTotal: incentiveTotal,
                milestoneTotal: milestoneTotal,
                penaltyTotal: penaltyTotal,
            },
            transactions,
        });
    }
    catch (err) {
        console.error('WALLET STATS ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};
exports.getWorkerWalletStats = getWorkerWalletStats;
const getWorkerTaskLogs = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        const { date } = req.query;
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const cleanerId = await getOrCreateCleanerId(workerId);
        const selectedDate = date ? new Date(date) : new Date();
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
        const tasksRes = await connectDatabase_1.pool.query(tasksQuery, [cleanerId, selectedDate]);
        return res.json({
            success: true,
            date: selectedDate,
            count: tasksRes.rows.length,
            tasks: tasksRes.rows,
        });
    }
    catch (err) {
        console.error('TASK LOGS ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};
exports.getWorkerTaskLogs = getWorkerTaskLogs;
const getCleanerFullDetailsController = async (req, res) => {
    try {
        const param = req.params.cleanerId;
        if (!param || Array.isArray(param)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cleaner ID',
            });
        }
        const cleanerId = param;
        if (!cleanerId) {
            return res.status(400).json({
                success: false,
                message: 'Cleaner ID is required',
            });
        }
        const { date } = req.query;
        const data = await (0, worker_service_1.getCleanerFullDetailsService)(connectDatabase_1.pool, cleanerId, {
            date: typeof date === 'string' ? date : undefined,
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.getCleanerFullDetailsController = getCleanerFullDetailsController;
