import { Router } from 'express';
import { login, logout, RegisterUser } from './auth_controller';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { refresh } from './refresh';

const router = Router();

/**
 * ONLY super_admin & admin can register users
 */
router.post('/register', protect, allowRoles('super_admin', 'admin'), RegisterUser);

router.post('/login', login);

router.post('/refresh', refresh);

router.post('/logout', logout);

export default router;
