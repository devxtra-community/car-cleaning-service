import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';

export const getMyPenalties = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;
    const { period = 'week' } = req.query; // 'day' | 'week' | 'month'

    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get cleaner_id from user_id (workerId)
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [workerId]);
    if (!cleanerRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Cleaner profile not found' });
    }
    const cleanerId = cleanerRes.rows[0].id;

    let dateCondition = '';

    // Using current date as reference

    if (period === 'day') {
      dateCondition = `AND created_at::date = CURRENT_DATE`;
    } else if (period === 'week') {
      // Current week
      dateCondition = `
        AND created_at >= date_trunc('week', CURRENT_DATE)
        AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      `;
    } else if (period === 'month') {
      // Current month
      dateCondition = `
        AND created_at >= date_trunc('month', CURRENT_DATE)
        AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
      `;
    } else {
      // Default to all time or specific limit if needed, but let's default to week if invalid
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

    const result = await pool.query(query, [cleanerId]);

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
  } catch (err) {
    console.error('GET PENALTIES ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
export const addPenalty = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorUserId = req.user?.userId;
    const { worker_id, amount, reason } = req.body;

    if (!supervisorUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!worker_id || !amount || !reason) {
      return res
        .status(400)
        .json({ success: false, message: 'worker_id, amount and reason are required' });
    }

    // 1. Get the supervisor's primary record ID
    const supervisorRes = await pool.query('SELECT id FROM supervisors WHERE user_id = $1', [
      supervisorUserId,
    ]);
    if (!supervisorRes.rows.length) {
      return res
        .status(403)
        .json({ success: false, message: 'You are not a registered supervisor' });
    }
    const supervisorId = supervisorRes.rows[0].id;

    // 2. Get the cleaner's record ID and verify they belong to this supervisor
    const cleanerRes = await pool.query(
      'SELECT id FROM cleaners WHERE user_id = $1 AND supervisor_id = $2',
      [worker_id, supervisorId]
    );

    if (!cleanerRes.rows.length) {
      return res
        .status(404)
        .json({ success: false, message: 'Worker not found or not assigned to you' });
    }
    const cleanerId = cleanerRes.rows[0].id;

    // 3. Create the penalty
    const result = await pool.query(
      `
      INSERT INTO penalties (cleaner_id, amount, reason, applied_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
      `,
      [cleanerId, amount, reason, supervisorUserId]
    );

    return res.status(201).json({
      success: true,
      message: 'Penalty added successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('ADD PENALTY ERROR:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getSupervisorPenalties = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorUserId = req.user?.userId;
    const { period = 'day' } = req.query;

    if (!supervisorUserId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get supervisor ID
    const supervisorRes = await pool.query('SELECT id FROM supervisors WHERE user_id = $1', [
      supervisorUserId,
    ]);
    if (!supervisorRes.rows.length) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const supervisorId = supervisorRes.rows[0].id;

    let dateCondition = '';
    // Support both short and long period names
    if (period === 'day' || period === 'daily') {
      dateCondition = 'AND p.created_at::date = CURRENT_DATE';
    } else if (period === 'week' || period === 'weekly') {
      dateCondition = "AND p.created_at >= date_trunc('week', CURRENT_DATE)";
    } else if (period === 'month' || period === 'monthly') {
      dateCondition = "AND p.created_at >= date_trunc('month', CURRENT_DATE)";
    }

    const query = `
      SELECT 
        u.id,
        u.full_name as "workerName",
        COUNT(p.id)::int as count,
        SUM(p.amount)::float as "totalAmount"
      FROM penalties p
      JOIN cleaners c ON p.cleaner_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE c.supervisor_id = $1
      ${dateCondition}
      GROUP BY u.id, u.full_name
      ORDER BY "totalAmount" DESC
    `;

    const result = await pool.query(query, [supervisorId]);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('GET SUPERVISOR PENALTIES ERROR:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
