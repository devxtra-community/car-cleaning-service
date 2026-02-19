import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';
import { getCleanerFullDetailsService } from './worker_service';
import { RequestHandler } from 'express';
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

export const getCleanerFullDetailsController: RequestHandler = async (req, res) => {
  try {
    const param = req.params.cleanerId;

    if (!param || Array.isArray(param)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cleaner ID',
      });
    }

    const cleanerId: string = param;

    if (!cleanerId) {
      return res.status(400).json({
        success: false,
        message: 'Cleaner ID is required',
      });
    }

    const { date } = req.query;

    const data = await getCleanerFullDetailsService(pool, cleanerId, {
      date: typeof date === 'string' ? date : undefined,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
