// building.routes.ts
import { Router } from 'express';
import {
  createBuilding,
  getAllBuildings,
  getBuildingById,
  deleteBuilding,
  getAllBuildingsWithStats,
  getBuildingDetails,
  updateBuilding,
} from './buildings_controller';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';

const router = Router();

// Get all buildings with statistics (NEW - for main page with revenue)
router.get('/stats', protect, allowRoles('admin', 'super_admin'), getAllBuildingsWithStats);

// Create building
router.post('/', protect, allowRoles('admin', 'super_admin'), createBuilding);

// Get all buildings (existing - simple version)
router.get('/', protect, allowRoles('admin', 'super_admin'), getAllBuildings);

// Get building details with comprehensive statistics (NEW - for details page)
router.get('/:id/details', protect, allowRoles('admin', 'super_admin'), getBuildingDetails);

// Get building by ID (existing)
router.get('/:id', protect, allowRoles('admin', 'super_admin'), getBuildingById);

// Update building (NEW)
router.put('/:id', protect, allowRoles('admin', 'super_admin'), updateBuilding);

// Delete building (existing)
router.delete('/:id', protect, allowRoles('admin', 'super_admin'), deleteBuilding);

export default router;
