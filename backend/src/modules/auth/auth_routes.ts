import { Router } from 'express';
import {
  registerUser,
  login,
  logout,
  getSupervisors,
  getCleaners,
  getCleanersBySupervisor,
} from './auth_controller';
import { uploadDocumentToS3, handleMulterError } from '../../middlewares/uploadMiddleware';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import { refresh } from './refresh';

const router = Router();

router.post(
  '/register',
  uploadDocumentToS3,
  handleMulterError,
  allowRoles('super_admin', 'admin'),
  registerUser
);

router.post('/login', login);

router.post('/logout', protect, logout);

router.get('/supervisors', protect, allowRoles('admin'), getSupervisors);

router.get('/cleaners', protect, allowRoles('admin'), getCleaners);
router.post('/refresh', refresh);

router.get('/supervisor/:supervisorId', protect, allowRoles('admin'), getCleanersBySupervisor);

export default router;
