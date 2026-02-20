"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supervisorReport = exports.getSupervisorWorkers = void 0;
const supervisor_services_1 = require("./supervisor_services");
const getSupervisorWorkers = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const supervisorId = req.user.userId;
    const workers = await (0, supervisor_services_1.getSupervisorWorkersService)(supervisorId);
    return res.json({ success: true, data: workers });
};
exports.getSupervisorWorkers = getSupervisorWorkers;
const supervisorReport = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const supervisorId = req.user.userId;
    const period = String(req.query.period || 'month');
    if (!['day', 'week', 'month'].includes(period)) {
        return res.status(400).json({
            success: false,
            message: 'period must be day/week/month',
        });
    }
    const report = await (0, supervisor_services_1.supervisorReportService)(supervisorId, period);
    return res.json({ success: true, data: report });
};
exports.supervisorReport = supervisorReport;
