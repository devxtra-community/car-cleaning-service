"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTaskController = exports.GetTaskpending = exports.createTaskController = void 0;
const tasks_service_1 = require("./tasks_service");
const connectDatabase_1 = require("../../database/connectDatabase");
/* ================= CREATE TASK ================= */
const createTaskController = async (req, res) => {
    try {
        const workerId = req.user?.userId;
        if (!workerId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { owner_name, owner_phone, car_number, car_model, car_type, car_color, car_image_url, task_amount, latitude, longitude, } = req.body;
        if (!owner_name || !owner_phone || !car_number || !car_model || !car_type || !car_color) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }
        // Validate GPS coordinates if provided
        if (latitude !== undefined || longitude !== undefined) {
            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: 'Both latitude and longitude are required for GPS verification',
                });
            }
            // Validate coordinate ranges
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid GPS coordinates',
                });
            }
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
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
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
      RETURNING task_amount, final_price, DATE(completed_at) as completed_date
      `, [taskId, cleanerProfileId, after_wash_image_url, payment_method, final_price]);
        if (!taskRes.rows.length) {
            throw new Error('TASK_NOT_FOUND');
        }
        const taskAmount = Number(taskRes.rows[0].final_price || taskRes.rows[0].task_amount || 0);
        const completedDate = taskRes.rows[0].completed_date;
        console.log('✅ Task marked as completed. Amount:', taskAmount, 'Date:', completedDate);
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
