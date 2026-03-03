"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupervisorCollections = exports.verifyTaskController = exports.getSupervisorCompletedTasks = exports.completeTaskController = exports.GetTaskpending = exports.createTaskController = void 0;
const tasks_service_1 = require("./tasks_service");
const connectDatabase_1 = require("../../database/connectDatabase");
/* ================= CREATE TASK ================= */
const createTaskController = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { owner_name, owner_phone, car_number, car_model, car_type, car_color, car_image_url, task_amount, amount_charged, } = req.body;
        if (!owner_name || !owner_phone || !car_number || !car_model || !car_type || !car_color) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        // Get cleaner_id from cleaners table using workerId (user_id)
        const cleanerRes = await connectDatabase_1.pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
        if (!cleanerRes.rows.length) {
            return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
        }
        const cleanerId = cleanerRes.rows[0].id;
        console.log('CreateTask: Found CleanerId:', cleanerId);
        const task = await (0, tasks_service_1.createTaskService)({
            owner_name,
            owner_phone,
            car_number,
            car_model,
            car_type,
            car_color,
            car_image_url: car_image_url ?? null,
            cleaner_id: cleanerId,
            task_amount: task_amount ?? 0,
            amount_charged: amount_charged ?? 0,
        });
        console.log('CreateTask: Task Inserted:', task);
        return res.status(201).json({ success: true, data: task });
    }
    catch (err) {
        console.log('CREATE TASK ERROR:', err);
        // Handle GPS-related errors
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('within') || errorMessage.includes('building')) {
            return res.status(400).json({
                success: false,
                message: errorMessage,
            });
        }
        return res.status(500).json({ success: false, message: 'Failed to create task' });
    }
};
exports.createTaskController = createTaskController;
/* ================= GET PENDING TASK ================= */
const GetTaskpending = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        // Get cleaner_id from cleaners table using workerId (user_id)
        const cleanerRes = await connectDatabase_1.pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
        if (!cleanerRes.rows.length) {
            // If no cleaner profile, they can't have tasks
            return res.json([]);
        }
        const cleanerId = cleanerRes.rows[0].id;
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        t.*,
        v.wash_time,
        v.type as vehicle_type,
        v.category as vehicle_category
      FROM tasks t
      LEFT JOIN vehicles v ON t.car_type = v.type
      WHERE t.cleaner_id=$1 AND t.status!='completed'
      ORDER BY t.created_at DESC
      LIMIT 1
      `, [cleanerId]);
        return res.json(result.rows);
    }
    catch (err) {
        console.error('GET TASK PENDING ERROR:', err);
        console.error('Stack:', err instanceof Error ? err.stack : 'No stack');
        return res.status(500).json({ success: false });
    }
};
exports.GetTaskpending = GetTaskpending;
/* ================= COMPLETE TASK ================= */
const completeTaskController = async (req, res) => {
    const workerId = req.user?.userId;
    const taskId = req.params.id;
    const { after_wash_image_url, payment_method, final_price } = req.body;
    if (!workerId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🚀 Starting Task Completion Process');
        console.log('Task ID:', taskId);
        console.log('Worker ID:', workerId);
        // Get cleaner_id from cleaners table using workerId (user_id)
        const cleanerProfileRes = await client.query('SELECT id FROM cleaners WHERE user_id = $1', [
            workerId,
        ]);
        if (!cleanerProfileRes.rows.length) {
            throw new Error('CLEANER_NOT_FOUND');
        }
        const cleanerProfileId = cleanerProfileRes.rows[0].id;
        console.log('✅ Cleaner Profile ID:', cleanerProfileId);
        /* ================= COMPLETE TASK ================= */
        const taskRes = await client.query(`
      UPDATE tasks
      SET status = 'completed',
          completed_at = now(),
          after_wash_image_url = COALESCE($3, after_wash_image_url),
          payment_method = COALESCE($4, payment_method),
          final_price = COALESCE($5, final_price)
      WHERE id = $1 AND cleaner_id = $2
      RETURNING *, DATE(completed_at) as completed_date
      `, [taskId, cleanerProfileId, after_wash_image_url, payment_method, final_price]);
        if (!taskRes.rows.length) {
            throw new Error('TASK_NOT_FOUND');
        }
        const taskData = taskRes.rows[0];
        const taskAmount = Number(taskData.final_price ||
            taskData.amount_charged ||
            taskData.task_amount ||
            0);
        const completedDate = taskData.completed_date;
        console.log('✅ Task marked as completed. Amount:', taskAmount, 'Date:', completedDate);
        /* ================= FRAUD DETECTION RULES ================= */
        try {
            // Rule 1: Missing after-wash photo
            if (!taskData.after_wash_image_url) {
                await client.query(`INSERT INTO fraud_cases (task_id, cleaner_id, type) VALUES ($1, $2, 'missing_photo')`, [taskId, cleanerProfileId]);
            }
            // Rule 2: Too fast completion
            if (taskData.started_at && taskData.completed_at) {
                const vehicleRes = await client.query('SELECT wash_time FROM vehicles WHERE type = $1', [taskData.car_type]);
                if (vehicleRes.rows.length > 0 && vehicleRes.rows[0].wash_time) {
                    const washTimeMs = vehicleRes.rows[0].wash_time * 60 * 1000;
                    const duration = new Date(taskData.completed_at).getTime() - new Date(taskData.started_at).getTime();
                    if (duration < washTimeMs * 0.3) {
                        await client.query(`INSERT INTO fraud_cases (task_id, cleaner_id, type) VALUES ($1, $2, 'too_fast')`, [taskId, cleanerProfileId]);
                    }
                }
            }
            // Rule 3: Duplicate vehicle
            if (taskData.car_number) {
                const duplicateRes = await client.query(`SELECT id FROM tasks 
           WHERE car_number = $1 
           AND id != $2 
           AND status = 'completed'
           AND completed_at >= NOW() - INTERVAL '2 hours'`, [taskData.car_number, taskId]);
                if (duplicateRes.rows.length > 0) {
                    await client.query(`INSERT INTO fraud_cases (task_id, cleaner_id, type) VALUES ($1, $2, 'duplicate_vehicle')`, [taskId, cleanerProfileId]);
                }
            }
        }
        catch (fraudErr) {
            console.error('⚠️ Fraud detection error (non-fatal):', fraudErr);
        }
        /* ================= UPDATE CLEANER TASK COUNT ================= */
        const cleanerRes = await client.query(`
      UPDATE cleaners
      SET total_tasks = total_tasks + 1,
          total_earning = total_earning + $1
      WHERE user_id = $2
      RETURNING id, total_tasks
      `, [taskAmount, workerId]);
        if (!cleanerRes.rows.length) {
            throw new Error('CLEANER_NOT_FOUND');
        }
        const cleanerId = cleanerRes.rows[0].id;
        const totalTasks = cleanerRes.rows[0].total_tasks;
        console.log('✅ Cleaner Stats Updated. Total Tasks:', totalTasks);
        /* ================= COUNT TODAY'S TASKS ================= */
        const todayTasksRes = await client.query(`
      SELECT COUNT(*)::int as tasks_today
      FROM tasks
      WHERE cleaner_id = $1 
        AND status = 'completed'
        AND DATE(completed_at) = $2
      `, [cleanerId, completedDate]);
        const tasksCompletedToday = todayTasksRes.rows[0].tasks_today || 0;
        console.log('✅ Tasks Completed Today:', tasksCompletedToday);
        /* ================= UPDATE DAILY WORK RECORD & CALCULATE INCENTIVES ================= */
        const dailyIncentives = await (0, tasks_service_1.updateDailyWorkRecord)(client, cleanerId, tasksCompletedToday, completedDate);
        /* ================= CHECK MILESTONE INCENTIVES ================= */
        const milestoneIncentives = await (0, tasks_service_1.checkMilestoneIncentives)(client, cleanerId, totalTasks);
        await client.query('COMMIT');
        console.log('✅ Transaction Committed Successfully');
        const allIncentives = [...dailyIncentives.incentivesEarned, ...milestoneIncentives];
        const totalIncentiveAmount = allIncentives.reduce((sum, inc) => sum + inc.amount, 0);
        console.log('🎉 Task Completion Summary:');
        console.log('- Daily Incentives:', dailyIncentives.incentivesEarned.length);
        console.log('- Milestone Incentives:', milestoneIncentives.length);
        console.log('- Total Incentive Amount:', totalIncentiveAmount);
        return res.json({
            success: true,
            data: {
                task_completed: true,
                total_tasks: totalTasks,
                tasks_today: tasksCompletedToday,
                incentives_earned: allIncentives,
                total_incentive_amount: totalIncentiveAmount,
                daily_incentives: dailyIncentives.incentivesEarned,
                milestone_incentives: milestoneIncentives,
            },
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ COMPLETE TASK ERROR:', err);
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Failed to complete task',
        });
    }
    finally {
        client.release();
    }
};
exports.completeTaskController = completeTaskController;
/* ================= SUPERVISOR: GET COMPLETED TASKS FOR PHOTO VERIFICATION ================= */
const getSupervisorCompletedTasks = async (req, res) => {
    try {
        const supervisorId = req.user?.userId;
        const limit = parseInt(req.query.limit) || 20;
        // Get supervisor's building
        const supervisorRes = await connectDatabase_1.pool.query('SELECT building_id FROM supervisors WHERE user_id = $1', [supervisorId]);
        if (!supervisorRes.rows.length)
            return res.json([]);
        const buildingId = supervisorRes.rows[0].building_id;
        // Get recent completed tasks for cleaners in this building
        const result = await connectDatabase_1.pool.query(`SELECT 
        t.id, t.car_number, t.car_type, t.owner_name, t.car_image_url,
        t.after_wash_image_url, t.created_at, t.completed_at,
        COALESCE(t.verification_status, 'pending') as verification_status,
        u.full_name as cleaner_name
       FROM tasks t
       JOIN cleaners c ON t.cleaner_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE c.building_id = $1 AND t.status = 'completed'
       ORDER BY t.completed_at DESC
       LIMIT $2`, [buildingId, limit]);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        console.error('GET SUPERVISOR COMPLETED TASKS ERROR:', err);
        return res.status(500).json({ success: false });
    }
};
exports.getSupervisorCompletedTasks = getSupervisorCompletedTasks;
/* ================= SUPERVISOR: VERIFY TASK PHOTOS ================= */
const verifyTaskController = async (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body; // 'approved' or 'flagged'
    if (!['approved', 'flagged'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be approved or flagged' });
    }
    try {
        await connectDatabase_1.pool.query('UPDATE tasks SET verification_status = $1 WHERE id = $2', [status, taskId]);
        return res.json({ success: true, message: `Task marked as ${status}` });
    }
    catch (err) {
        console.error('VERIFY TASK ERROR:', err);
        return res.status(500).json({ success: false });
    }
};
exports.verifyTaskController = verifyTaskController;
/* ================= SUPERVISOR: COLLECTION SUMMARY ================= */
const getSupervisorCollections = async (req, res) => {
    try {
        const supervisorId = req.user?.userId;
        // Get building from supervisor record
        const supervisorRes = await connectDatabase_1.pool.query('SELECT building_id FROM supervisors WHERE user_id = $1', [supervisorId]);
        if (!supervisorRes.rows.length)
            return res.json({ success: true, data: [] });
        const buildingId = supervisorRes.rows[0].building_id;
        const today = new Date().toISOString().split('T')[0];
        const result = await connectDatabase_1.pool.query(`SELECT
        c.id as cleaner_id,
        u.full_name as cleaner_name,
        COALESCE(SUM(CASE WHEN t.payment_method = 'Cash' THEN t.amount_charged ELSE 0 END), 0)::numeric AS cash,
        COALESCE(SUM(CASE WHEN t.payment_method = 'UPI' THEN t.amount_charged ELSE 0 END), 0)::numeric AS upi,
        COALESCE(SUM(CASE WHEN t.payment_method = 'Card' THEN t.amount_charged ELSE 0 END), 0)::numeric AS card,
        COALESCE(SUM(t.amount_charged), 0)::numeric AS total,
        COUNT(CASE WHEN t.payment_method IS NULL AND t.status = 'completed' THEN 1 END)::int AS pending_count
       FROM cleaners c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN tasks t ON t.cleaner_id = c.id
         AND t.status = 'completed'
         AND DATE(t.completed_at) = $2
       WHERE c.building_id = $1
       GROUP BY c.id, u.full_name
       ORDER BY total DESC`, [buildingId, today]);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        console.error('GET COLLECTIONS ERROR:', err);
        return res.status(500).json({ success: false });
    }
};
exports.getSupervisorCollections = getSupervisorCollections;
