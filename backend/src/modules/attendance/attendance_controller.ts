import { Request, Response } from 'express';
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

    // Get worker info (cleaner_id, building_id, supervisor_id)
    const workerInfo = await attendanceService.getWorkerInfo(userId);

    if (!workerInfo) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found',
      });
    }

    if (!workerInfo.building_id) {
      return res.status(400).json({
        success: false,
        message: 'No building assigned to worker',
      });
    }

    const attendance = await attendanceService.markAttendance({
      workerId: userId,
      cleanerId: workerInfo.cleaner_id,
      buildingId: workerInfo.building_id,
      supervisorId: workerInfo.supervisor_id,
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

    const info = await attendanceService.getWorkerInfo(userId);

    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'Worker info not found',
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
