import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { getSupervisorWorkersService, supervisorReportService } from './supervisor_services';

export const getSupervisorWorkers = async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supervisorId = req.user.userId;
  const workers = await getSupervisorWorkersService(supervisorId);

  return res.json({ success: true, data: workers });
};

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
