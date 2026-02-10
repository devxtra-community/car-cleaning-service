import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';

export const getWorkerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    const worker = await pool.query(`SELECT id, full_name FROM users WHERE id=$1`, [workerId]);

    const jobsDone = await pool.query(
      `SELECT COUNT(*) FROM tasks WHERE worker_id=$1 AND status='completed'`,
      [workerId]
    );

    const wallet = await pool.query(`SELECT balance FROM wallets WHERE worker_id=$1`, [workerId]);

    res.json({
      name: worker.rows[0].full_name,
      empId: worker.rows[0].id,
      jobsDone: Number(jobsDone.rows[0].count),
      totalRevenue: wallet.rows[0]?.balance || 0,
    });
  } catch {
    res.status(500).json({ message: 'Dashboard failed' });
  }
};
