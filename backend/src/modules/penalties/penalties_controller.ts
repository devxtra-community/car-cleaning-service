import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { createPenalty } from './penalties_service';
import { pool } from '../../database/connectDatabase';

export const addPenalty = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { worker_id, amount, reason } = req.body;
    console.log('addPenalty request:', { supervisorId, worker_id, amount, reason });

    if (!worker_id || !amount || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Verify worker belongs to supervisor
    const workerCheck = await pool.query(
      `SELECT c.id FROM cleaners c 
       JOIN supervisors s ON c.supervisor_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [worker_id, supervisorId]
    );

    if (!workerCheck.rows.length) {
      console.log('Worker verification failed for:', { worker_id, supervisorId });
      return res.status(403).json({ success: false, message: 'Worker not assigned to you' });
    }

    const penalty = await createPenalty({
      cleaner_id: worker_id,
      amount: parseFloat(amount),
      reason,
      applied_by: supervisorId,
    });

    return res.status(201).json({
      success: true,
      message: 'Penalty added successfully',
      data: penalty,
    });
  } catch (err) {
    console.error('Add penalty error', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to add penalty',
    });
  }
};

export const getSupervisorPenalties = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.userId;
    if (!supervisorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { period = 'daily' } = req.query;
    let dateFilter = '';

    if (period === 'daily') {
      dateFilter = `AND p.created_at::date = CURRENT_DATE`;
    } else if (period === 'weekly') {
      dateFilter = `AND p.created_at >= date_trunc('week', NOW())`;
    } else if (period === 'monthly') {
      dateFilter = `AND p.created_at >= date_trunc('month', NOW())`;
    }

    await pool.query(
      `SELECT 
        p.id,
        p.amount,
        p.reason,
        p.created_at,
        u.full_name as worker_name
       FROM penalties p
       JOIN cleaners c ON p.cleaner_id = c.id
       JOIN users u ON c.user_id = u.id
       JOIN supervisors s ON c.supervisor_id = s.id
       WHERE s.user_id = $1
       ${dateFilter}
       ORDER BY p.created_at DESC`,
      [supervisorId]
    );

    // Group by worker for the analytics view which expects grouped data
    // But the current view in penalty-history.tsx seems to expect a list of aggregated items per worker?
    // Let's look at the frontend interface:
    // interface PenaltyItem { id, workerName, count, totalAmount }

    // So we need to aggregate the data grouped by worker.

    const aggregatedStart = `
       SELECT 
        u.id as worker_id,
        u.full_name as worker_name,
        COUNT(p.id)::int as count,
        SUM(p.amount)::int as total_amount
       FROM penalties p
       JOIN cleaners c ON p.cleaner_id = c.id
       JOIN users u ON c.user_id = u.id
       JOIN supervisors s ON c.supervisor_id = s.id
       WHERE s.user_id = $1
       ${dateFilter}
       GROUP BY u.id, u.full_name
       ORDER BY total_amount DESC
    `;

    const aggregatedResult = await pool.query(aggregatedStart, [supervisorId]);

    // transform keys to match frontend expectation
    const data = aggregatedResult.rows.map((row) => ({
      id: row.worker_id,
      workerName: row.worker_name,
      count: row.count,
      totalAmount: row.total_amount,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get supervisor penalties error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch penalties' });
  }
};
