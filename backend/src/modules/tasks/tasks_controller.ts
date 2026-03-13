// src/modules/tasks/tasks_controller.ts
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import {
  createTaskService,
  updateDailyWorkRecord,
  checkMilestoneIncentives,
} from './tasks_service';
import { pool } from '../../database/connectDatabase';
import { sendNotificationToUser } from '../notifications/notification_service';

/* ================= CREATE TASK ================= */

export const createTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url,
      task_amount,
      latitude,
      longitude,
    } = req.body;

    if (!owner_name || !owner_phone || !car_number || !car_model || !car_type || !car_color) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    if (task_amount === undefined || task_amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Task amount must be greater than zero' });
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
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);

    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }

    const cleanerId = cleanerRes.rows[0].id;
    console.log('CreateTask: Found CleanerId:', cleanerId);

    const task = await createTaskService({
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
  } catch (err: unknown) {
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

/* ================= GET PENDING TASK ================= */

export const GetTaskpending = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    // Get cleaner_id from cleaners table using workerId (user_id)
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);

    if (!cleanerRes.rows.length) {
      // If no cleaner profile, they can't have tasks
      return res.json([]);
    }

    const cleanerId = cleanerRes.rows[0].id;

    const result = await pool.query(
      `
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
      `,
      [cleanerId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('GET TASK PENDING ERROR:', err);
    console.error('Stack:', err instanceof Error ? err.stack : 'No stack');
    return res.status(500).json({ success: false });
  }
};

/* ================= COMPLETE TASK ================= */

export const completeTaskController = async (req: AuthRequest, res: Response) => {
  const workerId = req.user?.userId;
  const taskId = req.params.id;
  const { after_wash_image_url, payment_method, final_price } = req.body;

  if (!workerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const client = await pool.connect();

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

    const taskRes = await client.query(
      `
      UPDATE tasks
      SET status = 'completed',
          completed_at = now(),
          after_wash_image_url = COALESCE($3, after_wash_image_url),
          payment_method = COALESCE($4, payment_method),
          final_price = COALESCE($5, final_price)
      WHERE id = $1 AND cleaner_id = $2
      RETURNING task_amount, final_price, DATE(completed_at) as completed_date
      `,
      [taskId, cleanerProfileId, after_wash_image_url, payment_method, final_price]
    );

    if (!taskRes.rows.length) {
      throw new Error('TASK_NOT_FOUND');
    }

    const taskAmount = Number(taskRes.rows[0].final_price || taskRes.rows[0].task_amount || 0);
    const completedDate = taskRes.rows[0].completed_date;
    console.log('✅ Task marked as completed. Amount:', taskAmount, 'Date:', completedDate);

    /* ================= UPDATE CLEANER TASK COUNT ================= */

    const cleanerRes = await client.query(
      `
      UPDATE cleaners
      SET total_tasks = total_tasks + 1,
          total_earning = total_earning + $1
      WHERE user_id = $2
      RETURNING id, total_tasks
      `,
      [taskAmount, workerId]
    );

    if (!cleanerRes.rows.length) {
      throw new Error('CLEANER_NOT_FOUND');
    }

    const cleanerId = cleanerRes.rows[0].id;
    const totalTasks = cleanerRes.rows[0].total_tasks;
    console.log('✅ Cleaner Stats Updated. Total Tasks:', totalTasks);

    /* ================= COUNT TODAY'S TASKS ================= */

    const todayTasksRes = await client.query(
      `
      SELECT COUNT(*)::int as tasks_today
      FROM tasks
      WHERE cleaner_id = $1 
        AND status = 'completed'
        AND DATE(completed_at) = $2
      `,
      [cleanerId, completedDate]
    );

    const tasksCompletedToday = todayTasksRes.rows[0].tasks_today || 0;
    console.log('✅ Tasks Completed Today:', tasksCompletedToday);

    /* ================= UPDATE DAILY WORK RECORD & CALCULATE INCENTIVES ================= */

    const dailyIncentives = await updateDailyWorkRecord(
      client,
      cleanerId,
      tasksCompletedToday,
      completedDate
    );

    /* ================= CHECK MILESTONE INCENTIVES ================= */

    const milestoneIncentives = await checkMilestoneIncentives(client, cleanerId, totalTasks);

    await client.query('COMMIT');
    console.log('✅ Transaction Committed Successfully');

    const allIncentives = [...dailyIncentives.incentivesEarned, ...milestoneIncentives];

    const totalIncentiveAmount = allIncentives.reduce((sum, inc) => sum + inc.amount, 0);

    console.log('- Total Incentive Amount:', totalIncentiveAmount);

    /* ================= SEND PUSH NOTIFICATION TO SUPERVISOR ================= */

    try {
      // Fetch details for notification
      const notifyRes = await pool.query(
        `
        SELECT 
          u.full_name as worker_name, 
          b.building_name as society_name, 
          s.user_id as supervisor_user_id
        FROM cleaners c
        JOIN users u ON c.user_id = u.id
        JOIN buildings b ON c.building_id = b.id
        JOIN supervisors s ON c.supervisor_id = s.id
        WHERE c.id = $1
        `,
        [cleanerId]
      );

      if (notifyRes.rows.length > 0) {
        const { worker_name, society_name, supervisor_user_id } = notifyRes.rows[0];

        await sendNotificationToUser(
          supervisor_user_id,
          '✅ Task Completed',
          `${worker_name} has completed the task at ${society_name}`,
          { type: 'task_completed', taskId, screen: 'TaskDetail' }
        );
      }
    } catch (pushErr) {
      console.error(
        '[PushNotification] Failed to notify supervisor after task completion:',
        pushErr
      );
      // Don't fail the response if notification fails
    }

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
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ COMPLETE TASK ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to complete task',
    });
  } finally {
    client.release();
  }
};

/* ================= SUPERVISOR: GET COMPLETED TASKS ================= */

export const getSupervisorCompletedTasks = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `
      SELECT 
        t.*,
        u.full_name as worker_name,
        v.wash_time,
        v.type as vehicle_type
      FROM tasks t
      JOIN cleaners c ON t.cleaner_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN vehicles v ON t.car_type = v.type
      WHERE s.user_id = $1 
        AND t.status = 'completed'
      ORDER BY t.completed_at DESC
      `,
      [supervisorId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('GET SUPERVISOR COMPLETED TASKS ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch completed tasks' });
  }
};

/* ================= SUPERVISOR: VERIFY TASK ================= */

export const verifyTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    const taskId = req.params.id;
    const { status, remarks } = req.body;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify supervisor owns this task's cleaner
    const taskCheck = await pool.query(
      `
      SELECT t.id 
      FROM tasks t
      JOIN cleaners c ON t.cleaner_id = c.id
      JOIN supervisors s ON c.supervisor_id = s.id
      WHERE t.id = $1 AND s.user_id = $2
      `,
      [taskId, supervisorId]
    );

    if (!taskCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET 
        status = $1,
        supervisor_remarks = $2,
        verified_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [status || 'verified', remarks || null, taskId]
    );

    /* ================= SEND PUSH NOTIFICATION TO WORKER ================= */

    if (status === 'flagged' || status === 'rejected') {
      try {
        const notifyRes = await pool.query(
          `
          SELECT 
            u.id as worker_user_id,
            b.building_name as society_name
          FROM tasks t
          JOIN cleaners c ON t.cleaner_id = c.id
          JOIN users u ON c.user_id = u.id
          JOIN buildings b ON c.building_id = b.id
          WHERE t.id = $1
          `,
          [taskId]
        );

        if (notifyRes.rows.length > 0) {
          const { worker_user_id, society_name } = notifyRes.rows[0];
          const title = status === 'flagged' ? '⚠️ Fraud Detected' : '❌ Task Rejected';

          await sendNotificationToUser(
            worker_user_id,
            title,
            `Your task at ${society_name} has been rejected. Reason: ${remarks || 'No reason provided'}`,
            { type: 'task_rejected', taskId, screen: 'TaskDetail' }
          );
        }
      } catch (pushErr) {
        console.error(
          '[PushNotification] Failed to notify worker after task rejection/flagging:',
          pushErr
        );
      }
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('VERIFY TASK ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify task' });
  }
};

/* ================= SUPERVISOR: GET COLLECTIONS ================= */

export const getSupervisorCollections = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(COALESCE(t.final_price, t.task_amount, 0)), 0)::float as total_collected,
        COALESCE(t.payment_method, 'cash') as payment_method,
        COUNT(*)::int as task_count
      FROM tasks t
      JOIN cleaners c ON t.cleaner_id = c.id
      JOIN supervisors s ON c.supervisor_id = s.id
      WHERE s.user_id = $1 
        AND t.status = 'completed'
        AND (t.completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
      GROUP BY t.payment_method
      `,
      [supervisorId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET SUPERVISOR COLLECTIONS ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch collections' });
  }
};
