import { Request, Response } from 'express';
import { pool } from '../../database/connectDatabase';

interface AuthRequest extends Request {
  user?: {
    userId: number;
  };
}

export const getWorkerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cleanerResult = await pool.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);

    if (!cleanerResult.rows.length) {
      return res.status(404).json({ message: 'Cleaner not found' });
    }

    const cleanerId = cleanerResult.rows[0].id;

    const worker = await pool.query(`SELECT id, full_name FROM users WHERE id = $1`, [userId]);

    const jobsDoneResult = await pool.query(
      `SELECT COUNT(*) FROM tasks WHERE cleaner_id = $1 AND status = 'completed'`,
      [cleanerId]
    );

    const walletResult = await pool.query(`SELECT balance FROM wallets WHERE cleaner_id = $1`, [
      cleanerId,
    ]);

    const jobsDone = Number(jobsDoneResult.rows[0]?.count ?? '0');
    const totalRevenue = Number(walletResult.rows[0]?.balance ?? '0');

    return res.json({
      name: worker.rows[0]?.full_name,
      empId: worker.rows[0]?.id,
      jobsDone,
      totalRevenue,
    });
  } catch (err) {
    console.error('Worker dashboard error:', err);
    return res.status(500).json({ message: 'Dashboard failed' });
  }
};
