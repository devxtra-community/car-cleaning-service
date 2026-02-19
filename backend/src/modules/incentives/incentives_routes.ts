// src/routes/incentive.routes.ts
import { Router } from 'express';
import {
  // Incentive Types
  createIncentiveTypeController,
  getAllIncentiveTypesController,
  getActiveIncentiveTypesController,
  updateIncentiveTypeController,
  deleteIncentiveTypeController,
  // Incentive Rules
  createIncentiveRuleController,
  getAllIncentiveRulesController,
  getIncentiveRulesByTypeController,
  getActiveIncentiveRulesController,
  updateIncentiveRuleController,
  deleteIncentiveRuleController,
  // Daily Work
  recordDailyWorkController,
  getDailyWorkRecordsController,
  getMonthlyIncentiveSummaryController,
} from './incentives_controller';

const router = Router();

/* ================= INCENTIVE TYPES ================= */
router.post('/types', createIncentiveTypeController);
router.get('/types', getAllIncentiveTypesController);
router.get('/types/active', getActiveIncentiveTypesController);
router.put('/types/:id', updateIncentiveTypeController);
router.delete('/types/:id', deleteIncentiveTypeController);

/* ================= INCENTIVE RULES ================= */
router.post('/rules', createIncentiveRuleController);
router.get('/rules', getAllIncentiveRulesController);
router.get('/rules/active', getActiveIncentiveRulesController);
router.get('/rules/type/:typeId', getIncentiveRulesByTypeController);
router.put('/rules/:id', updateIncentiveRuleController);
router.delete('/rules/:id', deleteIncentiveRuleController);

/* ================= DAILY WORK & RECORDS ================= */
router.post('/daily-work', recordDailyWorkController);
router.get('/daily-work/:cleanerId', getDailyWorkRecordsController);
router.get('/monthly-summary/:cleanerId/:month', getMonthlyIncentiveSummaryController);

export default router;
