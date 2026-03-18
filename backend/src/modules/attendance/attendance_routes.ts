import express from 'express';
import * as attendanceController from './attendance_controller';
import { protect } from '../../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Check if attendance marked today
router.get('/status', attendanceController.checkStatus);

// Mark attendance
router.post('/mark', attendanceController.markAttendance);

// Get attendance calendar
router.get('/calendar', attendanceController.getCalendar);

// Get worker info
router.get('/worker-info', attendanceController.getWorkerInfo);

export default router;
