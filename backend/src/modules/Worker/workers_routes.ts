import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { getWorkerDashboard } from './workers_controller';

const router = express.Router();

router.get('/dashboard', protect, getWorkerDashboard);

export default router;
