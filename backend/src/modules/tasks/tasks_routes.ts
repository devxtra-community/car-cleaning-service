import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { uploadTaskImageToS3 } from '../../middlewares/uploadToS3';
import { createTaskController } from './tasks_controller';

const router = express.Router();

router.post(
  '/tasks',
  protect,
  allowRoles('worker'),
  uploadTaskImageToS3.single('car_image'),
  createTaskController
);

router.patch('/tasks/:id/complete', protect, allowRoles('worker'), createTaskController);

router.get('/tasks/my', protect, allowRoles('worker'), createTaskController);

export default router;
