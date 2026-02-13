import { Router } from 'express';
import {
  registerUser,
  login,
  logout,
  getCleaners,
  getCleanersBySupervisor,
  getAllSupervisors,
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
router.get('/buildings/:buildingId/floors', getFloorsByBuilding);
router.get('/floors', getAllFloors);
router.get('/cleaners', protect, allowRoles('admin'), getCleaners);
router.post('/refresh', refresh);

router.get('/supervisor/:supervisorId', protect, allowRoles('admin'), getCleanersBySupervisor);

export default router;
