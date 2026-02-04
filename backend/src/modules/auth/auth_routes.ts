import { Router } from 'express';
import { registerUser, login, logout, refresh } from './auth_controller';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = Router();

/**
 * ONLY super_admin & admin can register users
 */
router.post('/register', protect, allowRoles('super_admin', 'admin'), registerUser);

// Login
router.post('/login', login);
router.post('/refresh', refresh);
// Logout
router.post('/logout', logout);

export default router;
