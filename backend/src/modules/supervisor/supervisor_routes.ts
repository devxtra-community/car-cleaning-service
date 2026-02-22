import { Router } from 'express';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import {
  getAllSupervisors,
  getUnassignedSupervisors,
  getBuildingsForDropdown,
  getSupervisorById,
  updateSupervisor,
  toggleSupervisorStatus,
  deleteSupervisor,
  getAvailableCleaners,
  assignCleanerToSupervisor,
  removeCleanerFromSupervisor,
} from './supervisor_controller';

const router = Router();
const adminOnly = [protect, allowRoles('admin', 'super_admin')];

// ── Static paths FIRST (must be before /:id) ──────────────────────────────────

router.get('/unassigned', ...adminOnly, getUnassignedSupervisors);
router.get('/buildings', ...adminOnly, getBuildingsForDropdown);

// ── Collection ────────────────────────────────────────────────────────────────

router.get('/', ...adminOnly, getAllSupervisors);

// ── Nested per-supervisor (specific sub-paths before /:id) ───────────────────

// GET    /api/supervisors/:id/available-cleaners
router.get('/:id/available-cleaners', ...adminOnly, getAvailableCleaners);

// POST   /api/supervisors/:id/assign-cleaner
router.post('/:id/assign-cleaner', ...adminOnly, assignCleanerToSupervisor);

// DELETE /api/supervisors/:id/cleaners/:cleanerId
router.delete('/:id/cleaners/:cleanerId', ...adminOnly, removeCleanerFromSupervisor);

// PATCH  /api/supervisors/:id/toggle-status
router.patch('/:id/toggle-status', ...adminOnly, toggleSupervisorStatus);

// ── Generic /:id (must come last) ─────────────────────────────────────────────

router.get('/:id', ...adminOnly, getSupervisorById);
router.put('/:id', ...adminOnly, updateSupervisor);
router.delete('/:id', ...adminOnly, deleteSupervisor);

export default router;
