import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { getMyPenalties } from './penalties_controller';

const router = express.Router();

router.get('/my', protect, getMyPenalties);

export default router;
