"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerInfo = exports.getCalendar = exports.markAttendance = exports.checkStatus = void 0;
const attendanceService = __importStar(require("./attendance_service"));
const connectDatabase_1 = require("../../database/connectDatabase");
const checkStatus = async (req, res) => {
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
        const calendar = await attendanceService.getAttendanceCalendar(userId, targetMonth, targetYear);
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
