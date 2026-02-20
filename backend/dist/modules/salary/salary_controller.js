"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markSalaryPaidController = exports.lockSalaryController = exports.getSalaryCyclesController = exports.generateSalaryForAllController = exports.generateSalaryForCleanerController = void 0;
const salary_service_1 = require("./salary_service");
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
        console.error('GENERATE CLEANER SALARY ERROR:', err);
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Failed to generate salary',
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
        const { payment_method } = req.body;
        if (!salaryId || Array.isArray(salaryId)) {
            return res.status(400).json({ success: false, message: 'Invalid salaryId' });
        }
        const result = await (0, salary_service_1.markSalaryAsPaid)(salaryId, payment_method);
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
