"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalaryBreakdownController = exports.getMonthlyReportController = exports.getRoleBasedSalariesController = exports.getSalariesByUserIdController = exports.getSalariesByCycleIdController = exports.getSalarySummaryController = exports.finalizeSalaryController = exports.markSalaryPaidController = exports.lockSalaryController = exports.getSalaryCyclesController = exports.generateSalaryForAllController = exports.generateSalaryForCleanerController = exports.getSalaryTimelineController = exports.getAllSalariesController = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const salary_service_1 = require("./salary_service");
/* ================= GET ALL SALARIES ================= */
const getAllSalariesController = async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const result = await (0, salary_service_1.getAllSalaries)(limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
        return res.json({
            success: true,
            data: result.rows,
            meta: {
                total: result.totalCount,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            },
        });
    }
    catch (err) {
        console.error('GET ALL SALARIES ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch salaries' });
    }
};
exports.getAllSalariesController = getAllSalariesController;
/* ================= GET SALARY TIMELINE (mobile calendar) ================= */
const getSalaryTimelineController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || Array.isArray(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }
        const timeline = await (0, salary_service_1.getSalaryTimeline)(userId);
        return res.json({ success: true, data: timeline });
    }
    catch (err) {
        console.error('SALARY TIMELINE ERROR:', err);
        return res
            .status(500)
            .json({ success: false, message: err instanceof Error ? err.message : 'Failed' });
    }
};
exports.getSalaryTimelineController = getSalaryTimelineController;
/* ================= GENERATE SALARY FOR ONE CLEANER ================= */
const generateSalaryForCleanerController = async (req, res) => {
    try {
        const { cycleId, cleanerId } = req.params;
        if (!cycleId || Array.isArray(cycleId)) {
            return res.status(400).json({ success: false, message: 'Invalid cycleId' });
        }
        if (!cleanerId || Array.isArray(cleanerId)) {
            return res.status(400).json({ success: false, message: 'Invalid cleanerId' });
        }
        if (!cycleId || !cleanerId) {
            return res.status(400).json({
                success: false,
                message: 'Missing cycleId or cleanerId',
            });
        }
        const result = await (0, salary_service_1.generateSalaryForUser)(cleanerId, cycleId);
        return res.json({
            success: true,
            message: 'Salary generated successfully for cleaner',
            data: result,
        });
    }
    catch (err) {
        console.error('GENERATE ERROR FULL:', err);
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Something went wrong',
        });
    }
};
exports.generateSalaryForCleanerController = generateSalaryForCleanerController;
/* ================= GENERATE SALARY FOR ALL CLEANERS ================= */
const generateSalaryForAllController = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const result = await (0, salary_service_1.generateSalaryForAllUsers)(cycleId);
        return res.json({
            success: true,
            message: 'Salary generated successfully',
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Something went wrong',
        });
    }
};
exports.generateSalaryForAllController = generateSalaryForAllController;
const getSalaryCyclesController = async (req, res) => {
    try {
        const cycles = await (0, salary_service_1.getAllSalaryCycles)();
        return res.json({
            success: true,
            data: cycles,
        });
    }
    catch (err) {
        console.error('FETCH SALARY CYCLES ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch salary cycles',
        });
    }
};
exports.getSalaryCyclesController = getSalaryCyclesController;
/* ================= LOCK SALARY CYCLE ================= */
const lockSalaryController = async (req, res) => {
    try {
        const { cycleId } = req.params;
        if (!cycleId || Array.isArray(cycleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cycleId',
            });
        }
        const result = await (0, salary_service_1.lockSalaryCycle)(cycleId);
        if (req.user?.userId) {
            await (0, auditLogger_1.logAuditAction)(req.user.userId, 'LOCK_SALARY_CYCLE', { cycleId });
        }
        return res.json({
            success: true,
            message: result.message,
        });
    }
    catch (err) {
        console.error('LOCK SALARY ERROR:', err);
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Failed to lock salary cycle',
        });
    }
};
exports.lockSalaryController = lockSalaryController;
const markSalaryPaidController = async (req, res) => {
    try {
        const { salaryId } = req.params;
        if (!salaryId || Array.isArray(salaryId)) {
            return res.status(400).json({ success: false, message: 'Invalid salaryId' });
        }
        const result = await (0, salary_service_1.markSalaryAsPaid)(salaryId);
        return res.json({
            success: true,
            message: 'Salary marked as paid',
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Something went wrong',
        });
    }
};
exports.markSalaryPaidController = markSalaryPaidController;
const finalizeSalaryController = async (req, res) => {
    try {
        const { salaryId } = req.params;
        if (!salaryId || Array.isArray(salaryId)) {
            return res.status(400).json({ success: false, message: 'Invalid salaryId' });
        }
        const result = await (0, salary_service_1.finalizeSalaryRecord)(salaryId);
        return res.json({
            success: true,
            message: 'Salary finalized successfully',
            data: result,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        if (message === 'SALARY_NOT_FOUND' ||
            message === 'SALARY_CYCLE_LOCKED' ||
            message === 'SALARY_ALREADY_LOCKED' ||
            message === 'SALARY_ALREADY_PAID') {
            return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({
            success: false,
            message,
        });
    }
};
exports.finalizeSalaryController = finalizeSalaryController;
const getSalarySummaryController = async (req, res) => {
    try {
        const { mode } = req.params;
        if (!mode || Array.isArray(mode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mode',
            });
        }
        const allowedModes = ['daily', 'weekly', 'monthly'];
        if (!allowedModes.includes(mode)) {
            return res.status(400).json({
                success: false,
                message: 'Mode must be daily, weekly, or monthly',
            });
        }
        const result = await (0, salary_service_1.getSalarySummary)(mode);
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Something went wrong',
        });
    }
};
exports.getSalarySummaryController = getSalarySummaryController;
const getSalariesByCycleIdController = async (req, res) => {
    try {
        const { cycleId } = req.params;
        if (!cycleId || Array.isArray(cycleId)) {
            return res.status(400).json({ success: false, message: 'Invalid cycleId' });
        }
        const result = await (0, salary_service_1.getSalariesByCycleId)(cycleId);
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Something went wrong',
        });
    }
};
exports.getSalariesByCycleIdController = getSalariesByCycleIdController;
const getSalariesByUserIdController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || Array.isArray(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }
        const result = await (0, salary_service_1.getSalariesByUserId)(userId);
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Something went wrong',
        });
    }
};
exports.getSalariesByUserIdController = getSalariesByUserIdController;
/* ================= GET ROLE-BASED SALARY SUMMARY ================= */
const getRoleBasedSalariesController = async (req, res) => {
    try {
        const { cycleId } = req.query;
        const data = await (0, salary_service_1.getRoleBasedSalaries)(cycleId);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('GET ROLE SALARIES ERROR:', err);
        return res
            .status(500)
            .json({ success: false, message: err instanceof Error ? err.message : String(err) });
    }
};
exports.getRoleBasedSalariesController = getRoleBasedSalariesController;
/* ================= GET MONTHLY REPORT SUMMARY ================= */
const getMonthlyReportController = async (req, res) => {
    try {
        const data = await (0, salary_service_1.getMonthlyReport)();
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('GET MONTHLY REPORT ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch monthly report' });
    }
};
exports.getMonthlyReportController = getMonthlyReportController;
const getSalaryBreakdownController = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const data = await (0, salary_service_1.getSalaryBreakdown)(salaryId);
        return res.json({ success: true, data });
    }
    catch (err) {
        console.error('GET BREAKDOWN ERROR:', err);
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Failed to fetch breakdown',
        });
    }
};
exports.getSalaryBreakdownController = getSalaryBreakdownController;
