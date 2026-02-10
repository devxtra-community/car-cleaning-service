import { Router } from 'express';
import {
  dailyProgressController,
  monthlyProgressController,
  weeklyProgressController,
} from './analytics_controller';

const router = Router();
router.get('/daily', dailyProgressController);
router.get('/weekly', weeklyProgressController);
router.get('/monthly', monthlyProgressController);

export default router;
