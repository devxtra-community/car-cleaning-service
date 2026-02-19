import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import {
  deleteSupervisor,
  getSupervisorById,
  getSupervisorWorkers,
  supervisorReport,
  toggleSupervisorStatus,
  updateSupervisor,
} from './supervisor_controller';

const router = express.Router();

router.get('/supervisor/workers', protect, allowRoles('supervisor'), getSupervisorWorkers);

router.get('/supervisor/report', protect, allowRoles('supervisor'), supervisorReport);

router.get('/:id', protect, allowRoles('admin'), getSupervisorById);

router.put('/:id', protect, allowRoles('admin'), updateSupervisor);

router.patch('/:id/status', protect, allowRoles('admin'), toggleSupervisorStatus);

router.delete('/:id', protect, allowRoles('admin'), deleteSupervisor);

export default router;
