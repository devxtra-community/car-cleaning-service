"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyProgressController = exports.weeklyProgressController = exports.dailyProgressController = void 0;
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
