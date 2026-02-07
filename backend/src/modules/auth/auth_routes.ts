import { Router } from 'express';
import { registerUser, login, logout, getSupervisors, getCleaners, getCleanersBySupervisor } from './auth_controller';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { uploadDocumentToS3 } from '../../middlewares/uploadMiddleware';
import { refresh } from './refresh';

const router = Router();

/**
 * ONLY super_admin & admin can register users
 */
router.post(
  '/register',
  uploadDocumentToS3,
  protect,
  allowRoles('super_admin', 'admin'),
  registerUser
);

router.post('/login', login);

router.post('/refresh', refresh);

router.post('/logout', logout);

// Get all supervisors (for cleaner assignment)
router.get('/supervisors', protect, getSupervisors);

// Get all cleaners
router.get('/cleaners', protect, getCleaners);

// Get cleaners by supervisor ID
router.get('/supervisors/:supervisorId/cleaners', protect, getCleanersBySupervisor);

export default router;
