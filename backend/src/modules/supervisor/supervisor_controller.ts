import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';
import { getSupervisorWorkersService, supervisorReportService } from './supervisor_services';

/* ================= WORKERS ================= */
export const getSupervisorWorkers = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supervisorId = req.user.userId;
  const workers = await getSupervisorWorkersService(supervisorId);

  return res.json({ success: true, data: workers });
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
      JOIN supervisor_workers sw ON sw.worker_id = t.worker_id
      JOIN users u ON u.id = t.worker_id
      WHERE sw.supervisor_id = $1
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
