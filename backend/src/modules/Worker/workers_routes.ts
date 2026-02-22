import express from 'express';
import { getCleanerFullDetailsController, getWorkerDashboard } from './workers_controller';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import { Router } from 'express';
import {
  getAllCleaners,
  getCleanerById,
  updateCleaner,
  toggleCleanerStatus,
  deleteCleaner,
  getBuildingsDropdown,
  getFloorsForBuilding,
  getSupervisorsForBuilding,
} from './workers_controller';
import { protect } from 'src/middlewares/authMiddleware';

const router = Router();
const adminOnly = [protect, allowRoles('admin', 'super_admin')];

router.get('/dashboard', ...adminOnly, getWorkerDashboard);

router.get('/cleaners/:cleanerId', ...adminOnly, getCleanerFullDetailsController);

// ── Static paths must come before /:id ───────────────────────────────────────
router.get('/buildings', ...adminOnly, getBuildingsDropdown);
router.get('/buildings/:buildingId/floors', ...adminOnly, getFloorsForBuilding);
router.get('/buildings/:buildingId/supervisors', ...adminOnly, getSupervisorsForBuilding);

// ── Collection ────────────────────────────────────────────────────────────────
router.get('/', ...adminOnly, getAllCleaners);

// ── Per-resource ──────────────────────────────────────────────────────────────
router.get('/:id', ...adminOnly, getCleanerById); // ?date=YYYY-MM-DD
router.put('/:id', ...adminOnly, updateCleaner);
router.patch('/:id/toggle-status', ...adminOnly, toggleCleanerStatus);
router.delete('/:id', ...adminOnly, deleteCleaner);

// Wire in main router: app.use('/api/cleaners', cleanersRouter);
// Also add checkCleanerNotBlocked to loginUserService — same pattern as checkSupervisorNotBlocked
// but queries: SELECT is_active FROM cleaners WHERE user_id = $1
export default router;
