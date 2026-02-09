import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import {
  getSupervisorWorkers,
  supervisorReport,
  getSupervisorTasks,
  getLiveWorkers,
  assignTaskToWorker,
  updateTask,
  updateSupervisorProfile,
} from './supervisor_controller';
import { addPenalty, getSupervisorPenalties } from '../penalties/penalties_controller';

const router = express.Router();

router.get('/workers', protect, allowRoles('supervisor', 'super_admin'), getSupervisorWorkers);
router.get('/workers/live', protect, allowRoles('supervisor', 'super_admin'), getLiveWorkers);
router.get('/report', protect, allowRoles('supervisor'), supervisorReport);
router.get('/tasks', protect, allowRoles('supervisor'), getSupervisorTasks);
router.post('/tasks', protect, allowRoles('supervisor'), assignTaskToWorker);
router.patch('/tasks/:id', protect, allowRoles('supervisor'), updateTask);

// Profile
router.patch('/profile', protect, allowRoles('supervisor'), updateSupervisorProfile);
console.log(' Supervisor profile route registered: PATCH /api/supervisor/profile');

// Penalties
router.post('/penalties', protect, allowRoles('supervisor'), addPenalty);
router.get('/penalties', protect, allowRoles('supervisor'), getSupervisorPenalties);

export default router;
