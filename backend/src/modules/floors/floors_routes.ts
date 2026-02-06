import { Router } from 'express';
import * as floorsController from './floors_controller';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = Router();

router.get('/:buildingId', protect, floorsController.getFloors);
router.post('/', protect, allowRoles('super_admin', 'admin'), floorsController.addFloor);
router.put('/:id', protect, allowRoles('super_admin', 'admin'), floorsController.editFloor);
router.delete('/:id', protect, allowRoles('super_admin', 'admin'), floorsController.removeFloor);

export default router;
