"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFraudTrends = exports.getCustomerRatingSummary = exports.getBuildingComparison = exports.peakActivityController = exports.collectionsReconciliationController = exports.cleanerPerformanceController = exports.monthlyProgressController = exports.weeklyProgressController = exports.dailyProgressController = void 0;
const analytics_service_1 = require("./analytics_service");
const dailyProgressController = async (req, res) => {
    try {
        const { date } = req.query;
        const data = await (0, analytics_service_1.getDailyProgress)(date);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch daily progress' });
    }
};
exports.dailyProgressController = dailyProgressController;
const weeklyProgressController = async (req, res) => {
    try {
        const { week } = req.query;
        const data = await (0, analytics_service_1.getWeeklyProgress)(week);
        res.json({ success: true, data });
    }
    catch {
        res.status(500).json({ success: false, message: 'Failed to fetch weekly progress' });
    }
};
exports.weeklyProgressController = weeklyProgressController;
const monthlyProgressController = async (req, res) => {
    try {
        const { month } = req.query;
        const data = await (0, analytics_service_1.getMonthlyProgress)(month);
        res.json({ success: true, data });
    }
    catch {
        res.status(500).json({ success: false, message: 'Failed to fetch monthly progress' });
    }
};
exports.monthlyProgressController = monthlyProgressController;
const cleanerPerformanceController = async (req, res) => {
    try {
        const { period } = req.query;
        const data = await (0, analytics_service_1.getCleanerPerformance)(period);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch cleaner performance' });
    }
};
exports.cleanerPerformanceController = cleanerPerformanceController;
const collectionsReconciliationController = async (req, res) => {
    try {
        const { month } = req.query;
        const data = await (0, analytics_service_1.getCollectionsReconciliation)(month);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch collections reconciliation' });
    }
};
exports.collectionsReconciliationController = collectionsReconciliationController;
const peakActivityController = async (req, res) => {
    try {
        const { period } = req.query;
        const data = await (0, analytics_service_1.getPeakActivity)(period || 'monthly');
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch peak activity data' });
    }
};
exports.peakActivityController = peakActivityController;
const getBuildingComparison = async (req, res) => {
    try {
        const data = await (0, analytics_service_1.getBuildingComparisonService)();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch building comparison' });
    }
};
exports.getBuildingComparison = getBuildingComparison;
const getCustomerRatingSummary = async (req, res) => {
    try {
        const data = await (0, analytics_service_1.getCustomerRatingSummaryService)();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch rating summary' });
    }
};
exports.getCustomerRatingSummary = getCustomerRatingSummary;
const getFraudTrends = async (req, res) => {
    try {
        const data = await (0, analytics_service_1.getFraudTrendsService)();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch fraud trends' });
    }
};
exports.getFraudTrends = getFraudTrends;
