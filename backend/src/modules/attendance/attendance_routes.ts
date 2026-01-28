import express from 'express';
import { AttendanceController } from '../attendance/attendance_controller';
import { protect } from '../../middlewares/authMiddleware';

const router = express.Router();

/**
 * Mark attendance on app load
 */
router.post('/attendance/login', protect, AttendanceController.markAttendance);

/**
 * Admin / Supervisor view
 */
router.get('/attendance/today', protect, AttendanceController.today);

export default router;
