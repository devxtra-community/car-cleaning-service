import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { getMe } from './user_Controller';

const router = express.Router();

router.get('/me', protect, getMe);

export default router;
