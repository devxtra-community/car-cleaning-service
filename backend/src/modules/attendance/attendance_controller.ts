import { Request, Response } from 'express';
import { AttendanceService } from './attendance_service';

type UserRole = 'admin' | 'accountant' | 'supervisor' | 'worker';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export class AttendanceController {
  static async markAttendance(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, role } = req.user;

    const exists = await AttendanceService.alreadyMarked(userId);

    if (exists) return res.json({ message: 'Already marked' });

    const attendance = await AttendanceService.markOnLogin({
      user_id: userId,
      role,
    });

    return res.json(attendance);
  }

  static async today(req: Request, res: Response) {
    const list = await AttendanceService.today();
    return res.json(list);
  }
}
