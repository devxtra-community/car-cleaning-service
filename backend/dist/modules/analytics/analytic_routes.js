"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics_controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
router.use((req, _res, next) => {
    console.log(`[ANALYTICS ROUTER HIT] ${req.method} ${req.path}`);
    next();
});
router.use(authMiddleware_1.authMiddleware);
router.use((0, roleMiddleware_1.allowRoles)('admin', 'accountant'));
router.get('/daily', analytics_controller_1.dailyProgressController);
router.get('/weekly', analytics_controller_1.weeklyProgressController);
router.get('/monthly', analytics_controller_1.monthlyProgressController);
router.get('/cleaner-performance', analytics_controller_1.cleanerPerformanceController);
router.get('/collections-reconciliation', analytics_controller_1.collectionsReconciliationController);
router.get('/peak-activity', analytics_controller_1.peakActivityController);
router.get('/building-comparison', analytics_controller_1.getBuildingComparison);
router.get('/building_comparison', analytics_controller_1.getBuildingComparison); // Alias for cached UI
router.get('/rating-summary', analytics_controller_1.getCustomerRatingSummary);
router.get('/rating_summary', analytics_controller_1.getCustomerRatingSummary); // Alias for cached UI
router.get('/cleaner-performance', analytics_controller_1.cleanerPerformanceController);
router.get('/cleaner_performance', analytics_controller_1.cleanerPerformanceController); // Alias for cached UI
router.get('/fraud-trends', analytics_controller_1.getFraudTrends);
router.get('/summary', analytics_controller_1.adminSummaryController);
router.get('/customer-report', analytics_controller_1.customerReportController);
exports.default = router;
