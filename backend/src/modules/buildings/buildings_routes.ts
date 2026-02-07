// building.routes.ts
import { Router } from 'express';
import { createBuilding, getAllBuildings, getBuildingById, deleteBuilding } from './buildings_controller';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';

const router = Router();

router.post('/', protect, allowRoles('admin', 'super_admin'), createBuilding);
router.get('/', protect, allowRoles('admin', 'super_admin'), getAllBuildings);
router.get('/:id', protect, allowRoles('admin', 'super_admin'), getBuildingById);
router.delete('/:id', protect, allowRoles('admin', 'super_admin'), deleteBuilding);

export default router;