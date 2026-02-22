import { Router } from 'express';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import {
  createBuilding,
  getAllBuildingsWithStats,
  getAllBuildings,
  getBuildingById,
  getBuildingDetails,
  getSupervisorsByBuilding,
  updateBuilding,
  assignSupervisorToBuilding,
  removeSupervisorFromBuilding,
  toggleSupervisorActive,
  deleteBuilding,
  getUnassignedSupervisors,
} from './buildings_controller';
import {
  getFloorsByBuilding,
  createFloor,
  updateFloor,
  deleteFloor,
} from '../floors/floor_controller';

const router = Router();
const adminOnly = [protect, allowRoles('admin', 'super_admin')];

// ── Building CRUD ─────────────────────────────────────────────────────────────

router.get('/stats', ...adminOnly, getAllBuildingsWithStats);
router.post('/', ...adminOnly, createBuilding);
router.get('/', ...adminOnly, getAllBuildings);

// ── Nested: floors ────────────────────────────────────────────────────────────
// Must come before /:id to avoid route conflict

router.get('/:id/details', ...adminOnly, getBuildingDetails);

// GET    /api/buildings/:id/floors           — list floors (registration dropdown + edit page)
router.get('/:id/floors', ...adminOnly, getFloorsByBuilding);
// POST   /api/buildings/:id/floors           — add a floor
router.post('/:id/floors', ...adminOnly, createFloor);
// PUT    /api/buildings/:id/floors/:floorId  — edit a floor
router.put('/:id/floors/:floorId', ...adminOnly, updateFloor);
// DELETE /api/buildings/:id/floors/:floorId  — delete a floor
router.delete('/:id/floors/:floorId', ...adminOnly, deleteFloor);

// ── Nested: supervisors ───────────────────────────────────────────────────────

// GET    /api/buildings/:id/supervisors                           — active supervisors (registration)
router.get('/:id/supervisors', ...adminOnly, getSupervisorsByBuilding);
// POST   /api/buildings/:id/supervisors                           — assign supervisor
router.post('/:id/supervisors', ...adminOnly, assignSupervisorToBuilding);
// DELETE /api/buildings/:id/supervisors/:supervisorId             — remove supervisor
router.delete('/:id/supervisors/:supervisorId', ...adminOnly, removeSupervisorFromBuilding);
// PATCH  /api/buildings/:id/supervisors/:supervisorId/toggle      — toggle active
router.patch('/:id/supervisors/:supervisorId/toggle', ...adminOnly, toggleSupervisorActive);

router.get('/supervisors/unassigned', ...adminOnly, getUnassignedSupervisors);

// ── Generic /:id  (must come last) ───────────────────────────────────────────

router.get('/:id', ...adminOnly, getBuildingById);
router.put('/:id', ...adminOnly, updateBuilding);
router.delete('/:id', ...adminOnly, deleteBuilding);

export default router;
