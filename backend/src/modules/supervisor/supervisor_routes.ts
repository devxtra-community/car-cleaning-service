import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import {
  getSupervisorWorkers,
  supervisorReport,
  getSupervisorTasks,
} from './supervisor_controller';

const router = express.Router();

router.get('/workers', protect, allowRoles('supervisor', 'super_admin'), getSupervisorWorkers);
router.get('/report', protect, allowRoles('supervisor'), supervisorReport);
router.get('/tasks', protect, allowRoles('supervisor'), getSupervisorTasks);

export default router;
