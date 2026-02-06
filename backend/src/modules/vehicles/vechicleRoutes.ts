import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from './vehicles_controller';

import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = Router();

/* ADMIN ONLY */

router.post('/', protect, allowRoles('admin'), createVehicle);
router.get('/', protect, getVehicles);
router.get('/:id', protect, getVehicleById);
router.put('/:id', protect, allowRoles('admin'), updateVehicle);
router.delete('/:id', protect, allowRoles('admin'), deleteVehicle);

export default router;
