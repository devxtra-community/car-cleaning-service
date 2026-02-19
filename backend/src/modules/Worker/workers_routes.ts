import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { getCleanerFullDetailsController, getWorkerDashboard } from './workers_controller';
import { allowRoles } from 'src/middlewares/roleMiddleware';

const router = express.Router();

router.get('/dashboard', protect, getWorkerDashboard);

router.get('/cleaners/:cleanerId', protect, allowRoles('admin'), getCleanerFullDetailsController);
export default router;
