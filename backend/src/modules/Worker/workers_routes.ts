import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { getWorkerDashboard, getWorkerWalletStats, getWorkerTaskLogs } from './workers_controller';

const router = express.Router();

router.get('/dashboard', protect, getWorkerDashboard);
router.get('/wallet', protect, getWorkerWalletStats);
router.get('/task-logs', protect, getWorkerTaskLogs);

export default router;
