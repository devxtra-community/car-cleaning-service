import { Request, Response } from 'express';
<<<<<<< HEAD
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
=======
import { AuthRequest } from '../../middlewares/authMiddleware';
import * as attendanceService from './attendance_service';
import { pool } from '../../database/connectDatabase';

export const checkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const attendance = await attendanceService.checkTodayAttendance(userId);

    return res.json({
      success: true,
      marked: !!attendance,
      attendance: attendance || null,
    });
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check attendance status',
    });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { latitude, longitude } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'GPS location is required',
      });
    }

    // Get user info (cleaner_id, building_id, supervisor_id)
    const role = req.user?.role || 'worker';
    const workerInfo = await attendanceService.getUserAttendanceInfo(userId, role);

    if (!workerInfo) {
      return res.status(404).json({
        success: false,
        message: `${role === 'supervisor' ? 'Supervisor' : 'Worker'} profile not found. Please contact your admin.`,
      });
    }

    if (!workerInfo.building_id) {
      return res.status(400).json({
        success: false,
        message:
          'No building is assigned to your profile yet. Please contact your supervisor or admin to assign a building.',
      });
    }

    const attendance = await attendanceService.markAttendance({
      workerId: userId,
      cleanerId: workerInfo.cleaner_id, // This will be null for supervisors
      buildingId: workerInfo.building_id,
      supervisorId: workerInfo.supervisor_id, // This will be null for supervisors
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });

    return res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('already marked')) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    if (errorMessage.includes('within')) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
    });
  }
};

export const getCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { month, year } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    // Get worker creation date
    const creationQuery = `SELECT created_at FROM users WHERE id = $1`;
    const creationResult = await pool.query(creationQuery, [userId]);
    const createdAt = creationResult.rows[0]?.created_at;

    // Get calendar for current month
    const calendar = await attendanceService.getAttendanceCalendar(userId, targetMonth, targetYear);

    // Get total attendance count
    const countQuery = `SELECT COUNT(*) as total FROM attendance WHERE worker_id = $1`;
    const countResult = await pool.query(countQuery, [userId]);
    const totalDays = parseInt(countResult.rows[0]?.total || '0');

    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      calendar,
      createdAt,
      totalDays,
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar',
    });
  }
};

export const getWorkerInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const role = req.user?.role || 'worker';
    const info = await attendanceService.getUserAttendanceInfo(userId, role);

    if (!info) {
      return res.status(404).json({
        success: false,
        message: `${role === 'supervisor' ? 'Supervisor' : 'Worker'} info not found`,
      });
    }

    return res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Get worker info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch worker info',
    });
  }
};
>>>>>>> origin/Sahileyy
