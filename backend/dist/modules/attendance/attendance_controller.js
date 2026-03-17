"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerInfo = exports.getCalendar = exports.markAttendance = exports.checkStatus = exports.AttendanceController = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const attendance_service_1 = require("./attendance_service");
class AttendanceController {
    static async markAttendance(req, res) {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { userId, role } = req.user;
        const exists = await attendance_service_1.AttendanceService.alreadyMarked(userId);
        if (exists)
            return res.json({ message: 'Already marked' });
        const attendance = await attendance_service_1.AttendanceService.markOnLogin({
            user_id: userId,
            role,
        });
        return res.json(attendance);
    }
    static async today(req, res) {
        const list = await attendance_service_1.AttendanceService.today();
        return res.json(list);
    }
}
exports.AttendanceController = AttendanceController;
// ============================================================
// MOBILE WORKER FUNCTIONAL CONTROLLERS (Sahileyy)
// ============================================================
const checkStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const attendance = await (0, attendance_service_1.checkTodayAttendance)(userId);
        return res.json({
            success: true,
            marked: !!attendance,
            attendance: attendance || null,
        });
    }
    catch (error) {
        console.error('Check status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check attendance status',
        });
    }
};
exports.checkStatus = checkStatus;
const markAttendance = async (req, res) => {
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
        const workerInfo = await (0, attendance_service_1.getUserAttendanceInfo)(userId, role);
        if (!workerInfo) {
            return res.status(404).json({
                success: false,
                message: `${role === 'supervisor' ? 'Supervisor' : 'Worker'} profile not found. Please contact your admin.`,
            });
        }
        if (!workerInfo.building_id) {
            return res.status(400).json({
                success: false,
                message: 'No building is assigned to your profile yet. Please contact your supervisor or admin to assign a building.',
            });
        }
        const attendance = await (0, attendance_service_1.markAttendance)({
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
    }
    catch (error) {
        console.error('Mark attendance error:', error);
        const errorMessage = error.message;
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
exports.markAttendance = markAttendance;
const getCalendar = async (req, res) => {
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
        const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();
        // Get worker creation date
        const creationQuery = `SELECT created_at FROM users WHERE id = $1`;
        const creationResult = await connectDatabase_1.pool.query(creationQuery, [userId]);
        const createdAt = creationResult.rows[0]?.created_at;
        // Get calendar for current month
        const calendar = await (0, attendance_service_1.getAttendanceCalendar)(userId, targetMonth, targetYear);
        // Get total attendance count
        const countQuery = `SELECT COUNT(*) as total FROM attendance WHERE worker_id = $1`;
        const countResult = await connectDatabase_1.pool.query(countQuery, [userId]);
        const totalDays = parseInt(countResult.rows[0]?.total || '0');
        return res.json({
            success: true,
            month: targetMonth,
            year: targetYear,
            calendar,
            createdAt,
            totalDays,
        });
    }
    catch (error) {
        console.error('Get calendar error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar',
        });
    }
};
exports.getCalendar = getCalendar;
const getWorkerInfo = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const role = req.user?.role || 'worker';
        const info = await (0, attendance_service_1.getUserAttendanceInfo)(userId, role);
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
    }
    catch (error) {
        console.error('Get worker info error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch worker info',
        });
    }
};
exports.getWorkerInfo = getWorkerInfo;
