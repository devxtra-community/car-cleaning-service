import express from 'express';
import {
  generateSalaryForCleanerController,
  generateSalaryForAllController,
  lockSalaryController,
  getSalaryCyclesController,
  getSalarySummaryController,
  getSalariesByCycleIdController,
  getSalariesByUserIdController,
  getAllSalariesController,
  getSalaryTimelineController,
  getRoleBasedSalariesController,
  getMonthlyReportController,
  getSalaryBreakdownController,
} from './salary_controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = express.Router();
router.use(authMiddleware);

// Get ALL salary records (used by SalaryFinalization page)
router.get('/', getAllSalariesController);

// Role-based salary view (web admin panel)
router.get('/role-summary', getRoleBasedSalariesController);

// Monthly report summary (accountant dashboard)
router.get('/monthly-report', getMonthlyReportController);
router.get('/breakdown/:salaryId', getSalaryBreakdownController);


router.get('/summary/:mode', getSalarySummaryController);

router.get('/salary-cycles', getSalaryCyclesController);
// Get salaries by cycle
router.get('/cycle/:cycleId', getSalariesByCycleIdController);

// Get salary history for a user
router.get('/user/:userId', getSalariesByUserIdController);

// Get salary timeline (calendar view for mobile app)
router.get('/user/:userId/timeline', getSalaryTimelineController);

// Generate salary for all cleaners in cycle
router.post('/generate/:cycleId', generateSalaryForAllController);

// Generate salary for one cleaner
router.post('/generate/:cycleId/:cleanerId', generateSalaryForCleanerController);

router.post('/lock/:cycleId', allowRoles('admin', 'accountant'), lockSalaryController);
export default router;
