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

    const task = await createTaskService({
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url: car_image_url ?? null,
      cleaner_id: workerId,
      task_amount: task_amount ?? 0,
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

    const result = await pool.query(
      `
      SELECT *
      FROM tasks
      WHERE cleaner_id=$1 AND status!='completed'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [workerId]
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

  if (!workerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /* ================= COMPLETE TASK ================= */

    const taskRes = await client.query(
      `
      UPDATE tasks
      SET status = 'completed',
          completed_at = now()
      WHERE id = $1 AND cleaner_id = $2
      RETURNING task_amount
      `,
      [taskId, workerId]
    );

    if (!taskRes.rows.length) {
      throw new Error('TASK_NOT_FOUND');
    }

    const taskAmount = Number(taskRes.rows[0].task_amount || 0);

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

    /* ================= INCENTIVE RULE CHECK ================= */

    // Get all active incentive rules
    const rulesRes = await client.query(
      `
      SELECT id, target_tasks, incentive_amount, reason
      FROM incentives
      WHERE active = true
      ORDER BY target_tasks ASC
      `
    );

    for (const rule of rulesRes.rows) {
      const target = rule.target_tasks;

      if (totalTasks % target === 0) {
        const milestoneCount = totalTasks / target;

        await client.query(
          `
      INSERT INTO cleaner_incentives (
        cleaner_id,
        incentive_rule_id,
        milestone_count,
        amount,
        reason
      )
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (cleaner_id, incentive_rule_id, milestone_count)
      DO NOTHING
    `,
          [
            cleanerId,
            rule.id,
            milestoneCount,
            rule.incentive_amount,
            rule.reason || `Completed ${target * milestoneCount} tasks`,
          ]
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
