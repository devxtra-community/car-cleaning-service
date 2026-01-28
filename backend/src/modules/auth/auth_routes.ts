import { Router } from 'express';
import { registerUser, login, logout } from './auth_controller';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { uploadTaskImageToS3 } from 'src/middlewares/uploadToS3';

const router = Router();

/**
 * ONLY super_admin & admin can register users
 */
router.post(
  '/register',
  protect,
  allowRoles('super_admin', 'admin'),
  uploadTaskImageToS3.single('document'),
  registerUser
);

// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

export default router;
