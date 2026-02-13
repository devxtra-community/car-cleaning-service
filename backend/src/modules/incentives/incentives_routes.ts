// src/routes/incentive.routes.ts
import { Router } from 'express';
import {
  createIncentiveController,
  getActiveIncentiveController,
  getAllIncentivesController,
  updateIncentiveController,
  deleteIncentiveController,
} from './incentives_controller';

const router = Router();

/* ================= INCENTIVE TARGETS ================= */

// Create new incentive target (deactivates previous ones)
router.post('/targets', createIncentiveController);

// Get active incentive target
router.get('/targets/active', getActiveIncentiveController);

// Get all incentive targets (history)
router.get('/targets', getAllIncentivesController);

// Update incentive target
router.put('/targets/:id', updateIncentiveController);

// Delete incentive target
router.delete('/targets/:id', deleteIncentiveController);

/* ================= DAILY WORK RECORDS ================= */

// // Record daily work for a cleaner
// router.post('/daily-work', recordDailyWorkController);

// // Get daily work records for a cleaner
// // Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD or ?month=YYYY-MM
// router.get('/daily-work/:cleanerId', getDailyWorkRecordsController);

// // Delete daily work record
// // Query params: ?cleanerId=xxx
// router.delete('/daily-work/:id', deleteDailyWorkRecordController);

// /* ================= MONTHLY SUMMARIES ================= */

// // Get monthly incentive summary for a specific cleaner
// // Query params: ?month=YYYY-MM
// router.get('/monthly-summary/:cleanerId', getMonthlyIncentiveSummaryController);

// // Get all cleaners' monthly incentive summaries
// // Query params: ?month=YYYY-MM
// router.get('/monthly-summary', getAllCleanersMonthlyIncentivesController);

export default router;
