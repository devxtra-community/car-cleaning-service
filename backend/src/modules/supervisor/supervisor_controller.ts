import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';
import { getSupervisorWorkersService, supervisorReportService } from './supervisor_services';

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

    // Validate required fields
    if (!worker_id || !owner_name || !owner_phone || !car_number || !car_model || !car_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Verify worker belongs to this supervisor
    const workerCheck = await pool.query(
      `SELECT c.user_id FROM cleaners c WHERE c.user_id = $1 AND c.supervisor_id = $2`,
      [worker_id, supervisorId]
    );

    if (!workerCheck.rows.length) {
      return res.status(403).json({ success: false, message: 'Worker not assigned to you' });
    }

    // Create the task
    const result = await pool.query(
      `
      INSERT INTO tasks (
        owner_name,
        owner_phone,
        car_number,
        car_model,
        car_type,
        car_color,
        car_image_url,
        car_location,
        cleaner_id,
        task_amount,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *
      `,
      [
        owner_name,
        owner_phone,
        car_number,
        car_model,
        car_type,
        car_color || null,
        car_image_url || null,
        car_location || null,
        worker_id,
        task_amount ? parseFloat(task_amount) : 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('Assign task error', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign task',
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
      JOIN cleaners c ON c.user_id = t.cleaner_id
      WHERE t.id = $1 AND c.supervisor_id = $2
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
        task_amount = COALESCE($7, task_amount),
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

    const { full_name, profile_image } = req.body;

    // Only full_name and profile_image can be updated
    if (!full_name && !profile_image) {
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

    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, profile_image, role
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
