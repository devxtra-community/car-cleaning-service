import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';
import {
  getSupervisorWorkersService,
  supervisorReportService,
  getSupervisorDashboardSummaryService,
  getSupervisorWorkersAttendanceService,
  updateWorkerAssignmentService,
  getSupervisorAnalyticsService,
} from './supervisor_services';
import { createTaskService } from '../tasks/tasks_service';
import { sendNotificationToUser } from '../notifications/notification_service';
import { logger } from '../../config/logger';

import { registerPushToken } from '../notifications/notification_service';

// Add this new function
export const registerPushTokenController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
    }

    const success = await registerPushToken(userId.toString(), pushToken);

    if (success) {
      logger.info(`Push token registered for user ${userId}`);
      return res.json({
        success: true,
        message: 'Push token registered successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to register push token',
      });
    }
  } catch (error) {
    logger.error('Register push token error', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    });
  }
};
/* ================= WORKERS ================= */
export const getSupervisorWorkers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const supervisorId = req.user.userId;
    console.log('getSupervisorWorkers: Fetching workers for supervisorId:', supervisorId);

    const workers = await getSupervisorWorkersService(supervisorId);
    console.log(`getSupervisorWorkers: Found ${workers.length} workers`);

    return res.json({ success: true, data: workers });
  } catch (err) {
    console.error('getSupervisorWorkers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch workers' });
  }
};

/* ================= REPORT ================= */
export const supervisorReport = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supervisorId = req.user.userId;
  const period = String(req.query.period || 'month');

  if (!['day', 'week', 'month'].includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'period must be day/week/month',
    });
  }

  const report = await supervisorReportService(supervisorId, period);
  return res.json({ success: true, data: report });
};

/* ================= DASHBOARD SUMMARY ================= */
export const getSupervisorDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const summary = await getSupervisorDashboardSummaryService(supervisorId);
    return res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error('getSupervisorDashboardSummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
  }
};

/* ================= TASKS ================= */
export const getSupervisorTasks = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    const period = String(req.query.period || 'day');

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let dateFilter = '';
    if (period === 'day') {
      dateFilter = `t.completed_at::date = CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `t.completed_at >= date_trunc('week', NOW())`;
    } else {
      dateFilter = `t.completed_at >= date_trunc('month', NOW())`;
    }

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.car_type,
        t.completed_at,
        u.full_name AS worker_name
      FROM tasks t
      JOIN cleaners c ON c.id = t.cleaner_id
      JOIN users u ON u.id = t.cleaner_id
      JOIN supervisors s ON c.supervisor_id = s.id
      WHERE s.user_id = $1
        AND t.status = 'completed'
        AND ${dateFilter}
      ORDER BY t.completed_at DESC
      `,
      [supervisorId]
    );

    return res.json({
      success: true,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Supervisor tasks error', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
    });
  }
};

/* ================= ATTENDANCE ================= */
export const getCleanersAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const attendance = await getSupervisorWorkersAttendanceService(supervisorId);
    return res.json({ success: true, data: attendance });
  } catch (err) {
    console.error('getCleanersAttendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
  }
};

/* ================= ASSIGNMENTS ================= */
export const updateCleanerAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { cleaner_id, floor_id } = req.body;

    if (!cleaner_id) {
      return res.status(400).json({ success: false, message: 'Cleaner ID is required' });
    }

    // Verify cleaner belongs to this supervisor
    const check = await pool.query(
      'SELECT id FROM cleaners WHERE id = $1 AND supervisor_id = (SELECT id FROM supervisors WHERE user_id = $2)',
      [cleaner_id, supervisorId]
    );

    if (check.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to manage this cleaner' });
    }

    const updated = await updateWorkerAssignmentService(cleaner_id, floor_id || null);

    return res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('updateCleanerAssignment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update assignment' });
  }
};

/* ================= LIVE WORKERS ================= */
export const getLiveWorkers = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        t.created_at AS started_at
      FROM tasks t
      JOIN cleaners c ON c.id = t.cleaner_id
      JOIN users u ON u.id = t.cleaner_id
      JOIN supervisors s ON c.supervisor_id = s.id
      WHERE s.user_id = $1
        AND t.status != 'completed'
      ORDER BY t.created_at DESC
      `,
      [supervisorId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Live workers error', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live workers',
    });
  }
};

/* ================= ASSIGN TASK TO WORKER ================= */
export const assignTaskToWorker = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      worker_id,
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      task_amount,
      car_image_url,
      car_location,
    } = req.body;

    console.log('Assign Task Request:', { worker_id, supervisorId, owner_name, car_number });

    // Validate required fields
    if (!worker_id || !owner_name || !owner_phone || !car_number || !car_model || !car_type) {
      console.log('Missing fields in request');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Verify worker belongs to this supervisor
    const workerCheck = await pool.query(
      `
      SELECT c.id AS cleaner_id 
      FROM cleaners c 
      JOIN supervisors s ON c.supervisor_id = s.id
      WHERE c.user_id = $1 AND s.user_id = $2
      `,
      [worker_id, supervisorId]
    );

    if (!workerCheck.rows.length) {
      console.log('Worker verification failed for worker_id:', worker_id);
      return res
        .status(403)
        .json({ success: false, message: 'Worker not assigned to you or invalid worker ID' });
    }

    const realCleanerId = workerCheck.rows[0].cleaner_id;
    console.log('Resolved realCleanerId:', realCleanerId);

    // Create the task using shared service (same logic as worker self-assign)
    const task = await createTaskService({
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url: car_image_url || null,
      car_location: car_location || null,
      cleaner_id: realCleanerId,
      task_amount: task_amount ? parseFloat(task_amount) : 0,
    });

    // Send push notification
    try {
      await sendNotificationToUser(worker_id, 'New Task Assigned', `${car_model} - ${car_number}`, {
        taskId: task.id,
        carNumber: car_number,
        carModel: car_model,
        type: 'task_assigned',
      });
      console.log(`Push notification sent to worker`);
    } catch (notifError) {
      console.error('Push notification failed:', notifError);
    }

    return res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      data: task,
    });
  } catch (err: unknown) {
    const error = err as { message: string; stack?: string; code?: string; detail?: string };
    console.error('='.repeat(80));
    console.error('ASSIGN TASK ERROR - DETAILED DEBUG:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('='.repeat(80));
    return res.status(500).json({
      success: false,
      message: 'Failed to assign task',
      error: error.message,
      detail: error.detail,
    });
  }
};

/* ================= UPDATE TASK ================= */
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    const taskId = req.params.id;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      task_amount,
      car_image_url,
      car_location,
    } = req.body;

    // Verify task belongs to a worker managed by this supervisor
    const taskCheck = await pool.query(
      `
      SELECT t.id 
      FROM tasks t
      JOIN cleaners c ON c.id = t.cleaner_id
      JOIN supervisors s ON c.supervisor_id = s.id
      WHERE t.id = $1 AND s.user_id = $2
      `,
      [taskId, supervisorId]
    );

    if (!taskCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Task not found or not authorized' });
    }

    // Update the task
    const result = await pool.query(
      `
      UPDATE tasks 
      SET 
        owner_name = COALESCE($1, owner_name),
        owner_phone = COALESCE($2, owner_phone),
        car_number = COALESCE($3, car_number),
        car_model = COALESCE($4, car_model),
        car_type = COALESCE($5, car_type),
        car_color = COALESCE($6, car_color),
        amount_charged = COALESCE($7, amount_charged),
        car_image_url = COALESCE($8, car_image_url),
        car_location = COALESCE($9, car_location)
      WHERE id = $10
      RETURNING *
      `,
      [
        owner_name || null,
        owner_phone || null,
        car_number || null,
        car_model || null,
        car_type || null,
        car_color || null,
        task_amount ? parseFloat(task_amount) : null,
        car_image_url || null,
        car_location || null,
        taskId,
      ]
    );

    return res.json({
      success: true,
      message: 'Task updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Update task error', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

/* ================= UPDATE SUPERVISOR PROFILE ================= */
export const updateSupervisorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { full_name, profile_image, phone } = req.body;

    // Only full_name, profile_image and phone can be updated
    if (!full_name && !profile_image && !phone) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (full_name) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }

    if (profile_image) {
      updates.push(`profile_image = $${paramIndex++}`);
      values.push(profile_image);
    }

    if (phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }

    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, profile_image, phone, role
    `;

    const result = await pool.query(query, values);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('updateSupervisorProfile error', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/* ================= ADMIN: GET SUPERVISOR FULL DETAILS ================= */
export const getAdminSupervisorDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Supervisor ID is required' });
    }

    // Get supervisor info using LEFT JOIN from users table to ensure we find them even if supervisor record is missing
    const supResult = await pool.query(
      `SELECT 
        u.id AS user_id,
        COALESCE(s.id, u.id) AS id,
        u.full_name,
        u.email,
        u.phone,
        u.document_id,
        u.profile_image,
        u.document,
        u.base_salary,
        u.nationality,
        COALESCE(s.is_active, true) AS is_active,
        u.joining_date,
        u.age,
        b.id AS building_id,
        b.building_name AS building_name
       FROM users u
       LEFT JOIN supervisors s ON u.id = s.user_id
       LEFT JOIN buildings b ON s.building_id = b.id
       WHERE (s.id = $1 OR u.id = $1) AND u.role = 'supervisor'`,
      [id]
    );

    if (!supResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }

    const sup = supResult.rows[0];

    // Get cleaners under this supervisor
    const cleanersResult = await pool.query(
      `SELECT 
        c.id,
        u.full_name,
        u.email,
        c.total_tasks,
        c.total_earning,
        u.base_salary,
        c.incentive_target,
        f.floor_number,
        f.id AS floor_id
       FROM cleaners c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN floors f ON c.floor_id = f.id
       WHERE c.supervisor_id = $1
       ORDER BY u.full_name ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        id: sup.id,
        full_name: sup.full_name,
        email: sup.email,
        phone: sup.phone,
        document_id: sup.document_id,
        profile_image: sup.profile_image,
        document: sup.document,
        base_salary: Number(sup.base_salary) || 0,
        nationality: sup.nationality,
        is_active: sup.is_active,
        joining_date: sup.joining_date,
        age: sup.age,
        building: sup.building_id ? { id: sup.building_id, name: sup.building_name } : null,
        cleaners: cleanersResult.rows.map((c) => ({
          id: c.id,
          full_name: c.full_name,
          email: c.email,
          total_tasks: c.total_tasks || 0,
          total_earning: Number(c.total_earning) || 0,
          base_salary: Number(c.base_salary) || 0,
          incentive_target: c.incentive_target || 0,
          floor: c.floor_id ? { id: c.floor_id, floor_number: c.floor_number } : null,
        })),
      },
    });
  } catch (err) {
    console.error('getAdminSupervisorDetails error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ================= ADMIN: UPDATE SUPERVISOR ================= */
export const updateAdminSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Supervisor ID is required' });
    }

    // Find the supervisor's user_id and current building
    const supCheck = await pool.query(
      `SELECT u.id AS user_id, s.id AS supervisor_id, s.building_id 
       FROM users u 
       LEFT JOIN supervisors s ON u.id = s.user_id 
       WHERE (s.id = $1 OR u.id = $1) AND u.role = 'supervisor'`,
      [id]
    );
    if (!supCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }
    const {
      user_id: userId,
      supervisor_id: existingSupId,
      building_id: currentBuildingId,
    } = supCheck.rows[0];

    const {
      full_name,
      email,
      phone,
      nationality,
      document_id,
      age,
      base_salary,
      building_id,
      profile_image,
      document,
      password,
    } = req.body;

    // Update users table
    const userUpdates: string[] = [];
    const userValues: (string | number | null)[] = [];
    let pi = 1;
    if (full_name) {
      userUpdates.push(`full_name = $${pi++}`);
      userValues.push(full_name);
    }
    if (email) {
      userUpdates.push(`email = $${pi++}`);
      userValues.push(email);
    }
    if (phone) {
      userUpdates.push(`phone = $${pi++}`);
      userValues.push(phone);
    }
    if (document_id) {
      userUpdates.push(`document_id = $${pi++}`);
      userValues.push(document_id);
    }
    if (profile_image) {
      userUpdates.push(`profile_image = $${pi++}`);
      userValues.push(profile_image);
    }
    if (document) {
      userUpdates.push(`document = $${pi++}`);
      userValues.push(document);
    }
    if (nationality !== undefined) {
      userUpdates.push(`nationality = $${pi++}`);
      userValues.push(nationality);
    }
    if (age !== undefined) {
      userUpdates.push(`age = $${pi++}`);
      userValues.push(Number(age));
    }
    if (base_salary !== undefined) {
      userUpdates.push(`base_salary = $${pi++}`);
      userValues.push(Number(base_salary));
    }

    if (password) {
      const bcrypt = await import('bcrypt');
      const hashed = await bcrypt.hash(password, 10);
      userUpdates.push(`password = $${pi++}`);
      userValues.push(hashed);
    }

    if (userUpdates.length) {
      userValues.push(userId);
      await pool.query(
        `UPDATE users SET ${userUpdates.join(', ')}, updated_at = NOW() WHERE id = $${pi}`,
        userValues
      );
    }

    // Update or Insert into supervisors table
    if (building_id !== undefined || full_name !== undefined) {
      await pool.query(
        `INSERT INTO supervisors (user_id, full_name, building_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET building_id = COALESCE(EXCLUDED.building_id, supervisors.building_id),
               full_name = COALESCE(EXCLUDED.full_name, supervisors.full_name),
               updated_at = NOW()`,
        [userId, full_name || null, building_id !== undefined ? building_id : null]
      );
    }

    // Return the updated record
    const updated = await pool.query(
      `SELECT 
        COALESCE(s.id, u.id) as id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.base_salary, 
        COALESCE(s.is_active, true) as is_active
       FROM users u 
       LEFT JOIN supervisors s ON u.id = s.user_id 
       WHERE u.id = $1`,
      [userId]
    );

    return res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error('updateAdminSupervisor error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ================= ADMIN: TOGGLE SUPERVISOR STATUS ================= */
export const toggleAdminSupervisorStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_active (boolean) is required' });
    }

    const result = await pool.query(
      `UPDATE supervisors SET is_active = $1 WHERE id = $2 RETURNING id, is_active`,
      [is_active, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('toggleAdminSupervisorStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ================= ADMIN: DELETE SUPERVISOR ================= */
export const deleteAdminSupervisor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Block deletion if there are assigned cleaners
    const cleanerCheck = await pool.query(
      'SELECT COUNT(*) FROM cleaners WHERE supervisor_id = $1',
      [id]
    );
    if (parseInt(cleanerCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete: supervisor still has assigned cleaners. Reassign them first.',
      });
    }

    // Find user_id before deleting
    const supCheck = await pool.query('SELECT user_id FROM supervisors WHERE id = $1', [id]);
    if (!supCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }
    const userId = supCheck.rows[0].user_id;

    await pool.query('DELETE FROM supervisors WHERE id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return res.json({ success: true, message: 'Supervisor deleted successfully' });
  } catch (err) {
    console.error('deleteAdminSupervisor error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ================= GET SUPERVISOR ANALYTICS ================= */
export const getSupervisorAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorUserId = req.user?.userId;

    if (!supervisorUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await getSupervisorAnalyticsService(supervisorUserId);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('getSupervisorAnalytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
    });
  }
};
