import { Router } from 'express';
import { registerUser, login, logout } from './auth_controller';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = Router();

/**
 * ONLY super_admin & admin can register users
 */
router.post('/register', protect, allowRoles('super_admin', 'admin'), registerUser);

// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

export default router;
