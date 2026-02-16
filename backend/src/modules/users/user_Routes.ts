import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { getMe, updatePushToken } from './user_Controller';

const router = express.Router();

router.get('/me', protect, getMe);
router.post('/push-token', protect, updatePushToken);

export default router;
