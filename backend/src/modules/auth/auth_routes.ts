import { Router } from 'express';
import {
  registerUser,
  login,
  logout,
  getCleaners,
  getCleanersBySupervisor,
  getAllSupervisors,
  forgotPasswordController,
  verifyOTPController,
  resetPasswordController,
} from './auth_controller';
import { uploadDocumentToS3, handleMulterError } from '../../middlewares/uploadMiddleware';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { refresh } from './refresh';
import { getAllFloors, getFloorsByBuilding } from '../floors/floor_controller';
import { registerPushTokenController } from '../supervisor/supervisor_controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { toggleUserStatusController, resetUserPasswordController } from './auth_controller';


const router = Router();

router.post('/register', uploadDocumentToS3, handleMulterError, protect, registerUser);

router.post('/login', login);

router.post('/forgot-password', forgotPasswordController);
router.post('/verify-otp', verifyOTPController);
router.post('/reset-password', resetPasswordController);

router.post('/logout', protect, logout);

router.get('/supervisors', protect, allowRoles('admin'), getAllSupervisors);

router.post('/register-push-token', authMiddleware, registerPushTokenController);
router.get('/buildings/:buildingId/floors', getFloorsByBuilding);
router.get('/floors', getAllFloors);
router.get('/cleaners', protect, allowRoles('admin'), getCleaners);
router.post('/refresh', refresh);

router.get('/supervisor/:supervisorId', protect, allowRoles('admin'), getCleanersBySupervisor);

/* USER MANAGEMENT - ADMIN ONLY */
router.patch('/users/:id/status', protect, allowRoles('admin'), toggleUserStatusController);
router.patch('/users/:id/reset-password', protect, allowRoles('admin'), resetUserPasswordController);

export default router;
