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
    });

    console.log('CreateTask: Task Inserted:', task);

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

    // Get cleaner_id from cleaners table using workerId (user_id)
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);

    if (!cleanerRes.rows.length) {
      // If no cleaner profile, they can't have tasks
      return res.json([]);
    }

    const cleanerId = cleanerRes.rows[0].id;

    const result = await pool.query(
      `
      SELECT *
      FROM tasks
      WHERE cleaner_id=$1 AND status!='completed'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanerId]
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
  const { after_wash_image_url, payment_method, final_price } = req.body;

  if (!workerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get cleaner_id from cleaners table using workerId (user_id)
    const cleanerProfileRes = await client.query('SELECT id FROM cleaners WHERE user_id = $1', [
      workerId,
    ]);

    if (!cleanerProfileRes.rows.length) {
      throw new Error('CLEANER_NOT_FOUND');
    }

    const cleanerProfileId = cleanerProfileRes.rows[0].id;

    /* ================= COMPLETE TASK ================= */

    console.log('Completing Task:', { taskId, workerId, body: req.body });

    const taskRes = await client.query(
      `
      UPDATE tasks
      SET status = 'completed',
          completed_at = now(),
          after_wash_image_url = COALESCE($3, after_wash_image_url),
          payment_method = COALESCE($4, payment_method),
          final_price = COALESCE($5, final_price)
      WHERE id = $1 AND cleaner_id = $2
      RETURNING task_amount, final_price
      `,
      [taskId, cleanerProfileId, after_wash_image_url, payment_method, final_price]
    );

    if (!taskRes.rows.length) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Use final_price if available, otherwise use task_amount
    const taskAmount = Number(taskRes.rows[0].final_price || taskRes.rows[0].task_amount || 0);

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
