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
  getSupervisorDashboardSummary,
  getAdminSupervisorDetails,
  updateAdminSupervisor,
  toggleAdminSupervisorStatus,
  deleteAdminSupervisor,
  getCleanersAttendance,
  updateCleanerAssignment,
} from './supervisor_controller';
import { addPenalty, getSupervisorPenalties } from '../penalties/penalties_controller';

const router = express.Router();

// ── Supervisor-role routes ────────────────────────────────────────────────────
router.get('/workers', protect, allowRoles('supervisor', 'super_admin'), getSupervisorWorkers);
router.get('/workers/live', protect, allowRoles('supervisor', 'super_admin'), getLiveWorkers);
router.get('/workers/attendance', protect, allowRoles('supervisor'), getCleanersAttendance);
router.post('/workers/assignment', protect, allowRoles('supervisor'), updateCleanerAssignment);
router.get('/report', protect, allowRoles('supervisor'), supervisorReport);
router.get('/tasks', protect, allowRoles('supervisor'), getSupervisorTasks);
router.post('/tasks', protect, allowRoles('supervisor'), assignTaskToWorker);
router.patch('/tasks/:id', protect, allowRoles('supervisor'), updateTask);
router.get(
  '/dashboard-summary',
  protect,
  allowRoles('supervisor', 'super_admin'),
  getSupervisorDashboardSummary
);

// Profile (supervisor self-update)
router.patch('/profile', protect, allowRoles('supervisor'), updateSupervisorProfile);
console.log(' Supervisor profile route registered: PATCH /api/supervisor/profile');

// Penalties
router.post('/penalties', protect, allowRoles('supervisor'), addPenalty);
router.get('/penalties', protect, allowRoles('supervisor'), getSupervisorPenalties);

// ── Admin CRUD routes ─────────────────────────────────────────────────────────
router.get('/:id', protect, allowRoles('admin', 'super_admin'), getAdminSupervisorDetails);
router.put('/:id', protect, allowRoles('admin', 'super_admin'), updateAdminSupervisor);
router.patch(
  '/:id/status',
  protect,
  allowRoles('admin', 'super_admin'),
  toggleAdminSupervisorStatus
);
router.delete('/:id', protect, allowRoles('admin', 'super_admin'), deleteAdminSupervisor);

export default router;
