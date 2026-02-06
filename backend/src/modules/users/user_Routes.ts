import express from 'express';
import { getAllSupervisors } from './user_Controller';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';

const router = express.Router();

router.get('/allsupervisors', protect, allowRoles('admin', 'super_admin'), getAllSupervisors);

export default router;
