import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { createTaskService } from './tasks_service';
import { logger } from '../../config/logger';
import { pool } from '../../database/connectDatabase';

/* ================= CREATE TASK ================= */
export const createTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    console.log('🔥 REQ BODY:', req.body);

    const {
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url, // comes from frontend
    } = req.body;

    if (!owner_name || !owner_phone || !car_number || !car_model || !car_type || !car_color) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const task = await createTaskService({
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url: car_image_url ?? null,
      worker_id: workerId,
    });

    return res.status(201).json({ success: true, data: task });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

/* ================= GET PENDING TASK ================= */

export const GetTaskpending = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await pool.query(
      `
    SELECT
 id,
 owner_name,
 owner_phone,
 car_number,
 car_model,
 car_color,
 car_type,
 status,
 car_image_url
FROM tasks
WHERE worker_id = $1
AND status != 'completed'
ORDER BY created_at DESC
LIMIT 1
      `,
      [workerId]
    );
    console.log('WORKER ID IN CONTROLLER:', req.user?.userId);

    return res.status(200).json(result.rows);
  } catch (err) {
    logger.error('GetTaskpending failed', { err });
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

export const completeTaskController = async (req: AuthRequest, res: Response) => {
  const workerId = req.user?.userId;

  await pool.query(`UPDATE tasks SET status='completed' WHERE id=$1`, [req.params.id]);

  // Increase completed jobs
  await pool.query(
    `UPDATE worker_incentives
     SET completed_jobs = completed_jobs + 1
     WHERE worker_id=$1`,
    [workerId]
  );

  // Check incentive
  const incentive = await pool.query(
    `
    SELECT wi.id, i.target_jobs, i.incentive_amount
    FROM worker_incentives wi
    JOIN incentives i ON i.id = wi.incentive_id
    WHERE wi.worker_id=$1 AND wi.earned=false
  `,
    [workerId]
  );

  if (incentive.rows.length) {
    const row = incentive.rows[0];

    if (row.completed_jobs >= row.target_jobs) {
      // Add money to wallet
      await pool.query(`UPDATE wallets SET balance = balance + $1 WHERE worker_id=$2`, [
        row.incentive_amount,
        workerId,
      ]);

      // Mark earned
      await pool.query(`UPDATE worker_incentives SET earned=true, earned_at=NOW() WHERE id=$1`, [
        row.id,
      ]);
    }
  }

  res.json({ success: true });
};
