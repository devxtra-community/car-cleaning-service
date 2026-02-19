import { Router } from 'express';
import {
  registerUser,
  login,
  logout,
  getCleanersBySupervisor,
  getAllSupervisors,
  getAllAccountantsController,
  getAllAdminsController,
} from './auth_controller';
import { uploadDocumentToS3, handleMulterError } from '../../middlewares/uploadMiddleware';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import { refresh } from './refresh';
import { getAllFloors, getFloorsByBuilding } from '../floors/floor_controller';

const router = Router();

router.post('/register', uploadDocumentToS3, handleMulterError, protect, registerUser);

router.post('/login', login);

router.post('/logout', protect, logout);

router.get('/supervisors', protect, allowRoles('admin'), getAllSupervisors);
router.get('/buildings/:buildingId/floors', protect, allowRoles('admin'), getFloorsByBuilding);
router.get('/floors', protect, allowRoles('admin'), getAllFloors);
router.get(
  '/accountants',
  protect,
  allowRoles('admin', 'super_admin'),
  getAllAccountantsController
);
router.get('/admins', protect, allowRoles('super_admin'), getAllAdminsController);

router.post('/refresh', refresh);

router.get('/supervisor/:supervisorId', protect, allowRoles('admin'), getCleanersBySupervisor);

export default router;
