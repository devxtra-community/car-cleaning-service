import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { completeTaskController, createTaskController, GetTaskpending } from './tasks_controller';

const router = express.Router();
router.post('/', protect, allowRoles('worker', 'admin', 'cleaner'), createTaskController);
router.get('/my', protect, allowRoles('worker', 'cleaner', 'admin', 'super_admin'), GetTaskpending);

router.patch(
  '/:id/complete',
  protect,
  allowRoles('worker', 'cleaner', 'admin'),
  completeTaskController
);

export default router;
