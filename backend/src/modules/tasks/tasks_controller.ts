import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { createTaskService } from './tasks_service';
import { pool } from '../../database/connectDatabase';

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
    } = req.body;

    if (!owner_name || !owner_phone || !car_number || !car_model || !car_type || !car_color) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Resolve real cleaner_id
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }
    const realCleanerId = cleanerRes.rows[0].id;

    const task = await createTaskService({
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url: car_image_url ?? null,
      cleaner_id: realCleanerId,
      amount_charged: task_amount ?? 0,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.log('CREATE TASK ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

/* ================= GET PENDING TASK ================= */

export const GetTaskpending = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    // Resolve real cleaner_id
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }
    const realCleanerId = cleanerRes.rows[0].id;

    const result = await pool.query(
      `
      SELECT *
      FROM tasks
      WHERE cleaner_id=$1 AND status!='completed'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [realCleanerId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false });
  }
};

/* ================= COMPLETE TASK ================= */

export const completeTaskController = async (req: AuthRequest, res: Response) => {
  const workerId = req.user?.userId;
  const taskId = req.params.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Resolve real cleaner_id
    const cleanerRes = await client.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) throw new Error('CLEANER_PROFILE_NOT_FOUND');
    const realCleanerId = cleanerRes.rows[0].id;

    // Complete task
    const taskRes = await client.query(
      `
      UPDATE tasks
      SET status='completed'
      WHERE id=$1 AND cleaner_id=$2
      RETURNING amount_charged AS task_amount
      `,
      [taskId, realCleanerId]
    );

    if (!taskRes.rows.length) throw new Error('TASK_NOT_FOUND');

    const taskAmount = taskRes.rows[0].task_amount;

    // Update cleaner totals
    await client.query(
      `
      UPDATE cleaners
      SET total_tasks = total_tasks + 1,
          total_earning = total_earning + $1
      WHERE user_id=$2
      `,
      [taskAmount, workerId]
    );

    // Incentive check
    const incentive = await client.query(
      `
      SELECT c.id, c.total_tasks, i.target_tasks, i.incentive_amount
      FROM cleaners c
      JOIN incentives i ON c.incentive_target=i.target_tasks
      WHERE c.user_id=$1
      `,
      [workerId]
    );

    if (incentive.rows.length) {
      const row = incentive.rows[0];

      if (row.total_tasks >= row.target_tasks) {
        await client.query(
          `
          UPDATE cleaners
          SET total_earning = total_earning + $1
          WHERE id=$2
          `,
          [row.incentive_amount, row.id]
        );
      }
    }

    await client.query('COMMIT');

    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.log('COMPLETE TASK ERROR:', err);
    return res.status(500).json({ success: false });
  } finally {
    client.release();
  }
};
