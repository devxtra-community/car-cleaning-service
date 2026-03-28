import { Router } from 'express';
import {
  dailyProgressController,
  monthlyProgressController,
  weeklyProgressController,
  cleanerPerformanceController,
  collectionsReconciliationController,
  peakActivityController,
  getBuildingComparison,
  getCustomerRatingSummary,
  getFraudTrends,
  adminSummaryController,
  customerReportController,
} from './analytics_controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = Router();
router.use((req, _res, next) => {
  console.log(`[ANALYTICS ROUTER HIT] ${req.method} ${req.path}`);
  next();
});
router.use(authMiddleware);
router.use(allowRoles('admin', 'accountant'));
router.get('/daily', dailyProgressController);
router.get('/weekly', weeklyProgressController);
router.get('/monthly', monthlyProgressController);
router.get('/cleaner-performance', cleanerPerformanceController);
router.get('/collections-reconciliation', collectionsReconciliationController);
router.get('/peak-activity', peakActivityController);
router.get('/building-comparison', getBuildingComparison);
router.get('/building_comparison', getBuildingComparison); // Alias for cached UI

router.get('/rating-summary', getCustomerRatingSummary);
router.get('/rating_summary', getCustomerRatingSummary); // Alias for cached UI

router.get('/cleaner-performance', cleanerPerformanceController);
router.get('/cleaner_performance', cleanerPerformanceController); // Alias for cached UI

router.get('/fraud-trends', getFraudTrends);
router.get('/summary', adminSummaryController);
router.get('/customer-report', customerReportController);

export default router;
