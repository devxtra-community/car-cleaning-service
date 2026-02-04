import { Router } from 'express';
import { protect } from 'src/middlewares/authMiddleware';
import { getVehicleDetails, vehicleDetails } from './vehicles_controller';
import { allowRoles } from 'src/middlewares/roleMiddleware';

const router = Router();

router.post('/add', protect, allowRoles('admin', 'super_admin'), vehicleDetails);

router.get(
  '/allVehicles',
  protect,
  allowRoles('admin', 'cleaner', 'superviser', 'accountant', 'super_admin'),
  getVehicleDetails
);

export default router;
