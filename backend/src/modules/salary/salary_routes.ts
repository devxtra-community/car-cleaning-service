import express from 'express';
import {
  generateSalaryForCleanerController,
  generateSalaryForAllController,
  lockSalaryController,
  getSalaryCyclesController,
} from './salary_controller';

const router = express.Router();

router.get('/salary-cycles', getSalaryCyclesController);
// Generate salary for all cleaners in cycle
router.post('/generate/:cycleId', generateSalaryForAllController);

// Generate salary for one cleaner
router.post('/generate/:cycleId/:cleanerId', generateSalaryForCleanerController);

router.post('/lock/:cycleId', lockSalaryController);
export default router;
