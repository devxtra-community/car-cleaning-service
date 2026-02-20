"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/incentive.routes.ts
const express_1 = require("express");
const incentives_controller_1 = require("./incentives_controller");
const router = (0, express_1.Router)();
/* ================= INCENTIVE TARGETS ================= */
// Create new incentive target (deactivates previous ones)
router.post('/targets', incentives_controller_1.createIncentiveController);
// Get active incentive target
router.get('/targets/active', incentives_controller_1.getActiveIncentiveController);
// Get all incentive targets (history)
router.get('/targets', incentives_controller_1.getAllIncentivesController);
// Update incentive target
router.put('/targets/:id', incentives_controller_1.updateIncentiveController);
// Delete incentive target
router.delete('/targets/:id', incentives_controller_1.deleteIncentiveController);
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
exports.default = router;
