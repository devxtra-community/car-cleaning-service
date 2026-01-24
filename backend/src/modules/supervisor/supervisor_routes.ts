import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { getSupervisorWorkers, supervisorReport } from './supervisor_controller';

const router = express.Router();

router.get('/supervisor/workers', protect, allowRoles('supervisor'), getSupervisorWorkers);

router.get('/supervisor/report', protect, allowRoles('supervisor'), supervisorReport);

export default router;
