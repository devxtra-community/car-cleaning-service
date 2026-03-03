"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyIncentiveSummaryController = exports.getDailyWorkRecordsController = exports.recordDailyWorkController = exports.deleteIncentiveRuleController = exports.updateIncentiveRuleController = exports.getActiveIncentiveRulesController = exports.getIncentiveRulesByTypeController = exports.getAllIncentiveRulesController = exports.createIncentiveRuleController = exports.deleteIncentiveTypeController = exports.updateIncentiveTypeController = exports.getActiveIncentiveTypesController = exports.getAllIncentiveTypesController = exports.createIncentiveTypeController = exports.deleteIncentiveTargetController = exports.updateIncentiveTargetController = exports.createIncentiveTargetController = exports.getAllIncentiveTargetsController = void 0;
const incentives_service_1 = require("./incentives_service");
const connectDatabase_1 = require("../../database/connectDatabase");
const getParamString = (value) => Array.isArray(value) ? value[0] : value;
/* ================= INCENTIVE TARGETS (simple task-count targets) ================= */
const getAllIncentiveTargetsController = async (_, res) => {
    try {
        const result = await connectDatabase_1.pool.query(`SELECT 
        it.*,
        u.full_name as cleaner_name,
        b.building_name,
        f.floor_name
       FROM incentive_targets it
       LEFT JOIN cleaners c ON it.cleaner_id = c.id
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN buildings b ON it.building_id = b.id
       LEFT JOIN floors f ON it.floor_id = f.id
       ORDER BY it.created_at DESC`);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        console.error('GET TARGETS ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch targets' });
    }
};
exports.getAllIncentiveTargetsController = getAllIncentiveTargetsController;
const createIncentiveTargetController = async (req, res) => {
    try {
        const { target_tasks, reason, incentive_amount, cleaner_id, building_id, floor_id } = req.body;
        if (!reason || target_tasks === undefined || incentive_amount === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const result = await connectDatabase_1.pool.query(`INSERT INTO incentive_targets (reason, target_tasks, incentive_amount, active, cleaner_id, building_id, floor_id)
       VALUES ($1, $2, $3, true, $4, $5, $6) RETURNING *`, [reason, Number(target_tasks), Number(incentive_amount), cleaner_id || null, building_id || null, floor_id || null]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        console.error('CREATE TARGET ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to create target' });
    }
};
exports.createIncentiveTargetController = createIncentiveTargetController;
const updateIncentiveTargetController = async (req, res) => {
    try {
        const { id } = req.params;
        const { target_tasks, reason, incentive_amount, cleaner_id, building_id, floor_id, active } = req.body;
        const result = await connectDatabase_1.pool.query(`UPDATE incentive_targets
       SET reason = COALESCE($1, reason),
           target_tasks = COALESCE($2, target_tasks),
           incentive_amount = COALESCE($3, incentive_amount),
           cleaner_id = COALESCE($4, cleaner_id),
           building_id = COALESCE($5, building_id),
           floor_id = COALESCE($6, floor_id),
           active = COALESCE($7, active),
           updated_at = NOW()
       WHERE id = $8 RETURNING *`, [
            reason,
            target_tasks !== undefined ? Number(target_tasks) : undefined,
            incentive_amount !== undefined ? Number(incentive_amount) : undefined,
            cleaner_id || null,
            building_id || null,
            floor_id || null,
            active,
            id
        ]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Target not found' });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        console.error('UPDATE TARGET ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to update target' });
    }
};
exports.updateIncentiveTargetController = updateIncentiveTargetController;
const deleteIncentiveTargetController = async (req, res) => {
    try {
        const { id } = req.params;
        await connectDatabase_1.pool.query('DELETE FROM incentive_targets WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Target deleted' });
    }
    catch (err) {
        console.error('DELETE TARGET ERROR:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete target' });
    }
};
exports.deleteIncentiveTargetController = deleteIncentiveTargetController;
/* ================= INCENTIVE TYPES ================= */
const createIncentiveTypeController = async (req, res) => {
    try {
        const { name, category, calculation_type, description } = req.body;
        if (!name || !category || !calculation_type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, category, calculation_type',
            });
        }
        const validCategories = ['performance', 'attendance', 'quality', 'overtime', 'milestone'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
            });
        }
        const validCalculationTypes = ['fixed', 'percentage', 'tiered', 'per_unit'];
        if (!validCalculationTypes.includes(calculation_type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid calculation_type. Must be one of: ${validCalculationTypes.join(', ')}`,
            });
        }
        const incentiveType = await (0, incentives_service_1.createIncentiveType)({
            name,
            category,
            calculation_type,
            description,
        });
        return res.status(201).json({
            success: true,
            data: incentiveType,
            message: 'Incentive type created successfully',
        });
    }
    catch (error) {
        console.error('CREATE INCENTIVE TYPE ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create incentive type',
        });
    }
};
exports.createIncentiveTypeController = createIncentiveTypeController;
const getAllIncentiveTypesController = async (_, res) => {
    try {
        const incentiveTypes = await (0, incentives_service_1.getAllIncentiveTypes)();
        return res.json({
            success: true,
            data: incentiveTypes,
            count: incentiveTypes.length,
        });
    }
    catch (error) {
        console.error('GET ALL INCENTIVE TYPES ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch incentive types',
        });
    }
};
exports.getAllIncentiveTypesController = getAllIncentiveTypesController;
const getActiveIncentiveTypesController = async (_, res) => {
    try {
        const incentiveTypes = await (0, incentives_service_1.getActiveIncentiveTypes)();
        return res.json({
            success: true,
            data: incentiveTypes,
            count: incentiveTypes.length,
        });
    }
    catch (error) {
        console.error('GET ACTIVE INCENTIVE TYPES ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active incentive types',
        });
    }
};
exports.getActiveIncentiveTypesController = getActiveIncentiveTypesController;
const updateIncentiveTypeController = async (req, res) => {
    try {
        const id = getParamString(req.params.id);
        const { name, category, calculation_type, description, active } = req.body;
        const incentiveType = await (0, incentives_service_1.updateIncentiveType)(id, {
            name,
            category,
            calculation_type,
            description,
            active,
        });
        return res.json({
            success: true,
            data: incentiveType,
            message: 'Incentive type updated successfully',
        });
    }
    catch (error) {
        console.error('UPDATE INCENTIVE RULE ERROR:', error);
        if (error instanceof Error && error.message === 'INCENTIVE_RULE_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Incentive rule not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to update incentive rule',
        });
    }
};
exports.updateIncentiveTypeController = updateIncentiveTypeController;
const deleteIncentiveTypeController = async (req, res) => {
    try {
        const id = getParamString(req.params.id);
        await (0, incentives_service_1.deleteIncentiveType)(id);
        return res.json({
            success: true,
            message: 'Incentive type deleted successfully',
        });
    }
    catch (error) {
        console.error('DELETE INCENTIVE TYPE ERROR:', error);
        if (error instanceof Error && error.message === 'INCENTIVE_TYPE_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Incentive type not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to delete incentive type',
        });
    }
};
exports.deleteIncentiveTypeController = deleteIncentiveTypeController;
/* ================= INCENTIVE RULES ================= */
const createIncentiveRuleController = async (req, res) => {
    try {
        const { incentive_type_id, rule_name, base_amount, criteria, priority, active } = req.body;
        if (!incentive_type_id || !rule_name || base_amount === undefined || !criteria) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const sanitizedCriteria = { ...criteria };
        Object.keys(sanitizedCriteria).forEach((key) => {
            const value = sanitizedCriteria[key];
            if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
                sanitizedCriteria[key] = Number(value);
            }
        });
        const rule = await (0, incentives_service_1.createIncentiveRule)({
            incentive_type_id,
            rule_name,
            base_amount: Number(base_amount),
            criteria: sanitizedCriteria,
            priority: priority !== undefined ? Number(priority) : 0,
        });
        if (active !== undefined) {
            await (0, incentives_service_1.updateIncentiveRule)(rule.id, { active });
        }
        return res.status(201).json({ success: true, data: rule });
    }
    catch (err) {
        console.error('CREATE RULE ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to create incentive rule',
        });
    }
};
exports.createIncentiveRuleController = createIncentiveRuleController;
const getAllIncentiveRulesController = async (_, res) => {
    try {
        const incentiveRules = await (0, incentives_service_1.getAllIncentiveRules)();
        return res.json({
            success: true,
            data: incentiveRules,
            count: incentiveRules.length,
        });
    }
    catch (error) {
        console.error('GET ALL INCENTIVE RULES ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch incentive rules',
        });
    }
};
exports.getAllIncentiveRulesController = getAllIncentiveRulesController;
const getIncentiveRulesByTypeController = async (req, res) => {
    try {
        const typeId = getParamString(req.params.typeId);
        const rules = await (0, incentives_service_1.getIncentiveRulesByType)(typeId);
        return res.json({
            success: true,
            data: rules,
            count: rules.length,
        });
    }
    catch (error) {
        console.error('GET RULES BY TYPE ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch incentive rules',
        });
    }
};
exports.getIncentiveRulesByTypeController = getIncentiveRulesByTypeController;
const getActiveIncentiveRulesController = async (_, res) => {
    try {
        const rules = await (0, incentives_service_1.getActiveIncentiveRules)();
        return res.json({
            success: true,
            data: rules,
            count: rules.length,
        });
    }
    catch (error) {
        console.error('GET ACTIVE RULES ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active incentive rules',
        });
    }
};
exports.getActiveIncentiveRulesController = getActiveIncentiveRulesController;
const updateIncentiveRuleController = async (req, res) => {
    try {
        const id = getParamString(req.params.id);
        const { rule_name, base_amount, criteria, priority, active } = req.body;
        const incentiveRule = await (0, incentives_service_1.updateIncentiveRule)(id, {
            rule_name,
            base_amount: base_amount !== undefined ? Number(base_amount) : undefined,
            criteria,
            priority: priority !== undefined ? Number(priority) : undefined,
            active,
        });
        return res.json({
            success: true,
            data: incentiveRule,
            message: 'Incentive rule updated successfully',
        });
    }
    catch (error) {
        console.error('UPDATE INCENTIVE RULE ERROR:', error);
        if (error instanceof Error && error.message === 'INCENTIVE_RULE_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Incentive rule not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to update incentive rule',
        });
    }
};
exports.updateIncentiveRuleController = updateIncentiveRuleController;
const deleteIncentiveRuleController = async (req, res) => {
    try {
        const id = getParamString(req.params.id);
        await (0, incentives_service_1.deleteIncentiveRule)(id);
        return res.json({
            success: true,
            message: 'Incentive rule deleted successfully',
        });
    }
    catch (error) {
        console.error('DELETE INCENTIVE RULE ERROR:', error);
        if (error instanceof Error && error.message === 'INCENTIVE_RULE_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Incentive rule not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to delete incentive rule',
        });
    }
};
exports.deleteIncentiveRuleController = deleteIncentiveRuleController;
/* ================= DAILY WORK ================= */
const recordDailyWorkController = async (req, res) => {
    try {
        const { cleaner_id, date, tasks_completed, hours_worked, is_overtime, is_weekend, customer_rating, hourly_rate, notes, } = req.body;
        if (!cleaner_id || !date || tasks_completed === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: cleaner_id, date, tasks_completed',
            });
        }
        const result = await (0, incentives_service_1.recordDailyWork)({
            cleaner_id,
            date,
            tasks_completed: Number(tasks_completed),
            hours_worked: hours_worked ? Number(hours_worked) : undefined,
            is_overtime,
            is_weekend,
            customer_rating: customer_rating ? Number(customer_rating) : undefined,
            hourly_rate: hourly_rate ? Number(hourly_rate) : undefined,
            notes,
        });
        return res.status(201).json({
            success: true,
            data: result,
            message: 'Daily work recorded successfully',
        });
    }
    catch (error) {
        console.error('RECORD DAILY WORK ERROR:', error);
        if (error instanceof Error && error.message === 'NO_ACTIVE_INCENTIVE_TARGET') {
            return res.status(404).json({
                success: false,
                message: 'No active incentive rules found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to record daily work',
        });
    }
};
exports.recordDailyWorkController = recordDailyWorkController;
const getDailyWorkRecordsController = async (req, res) => {
    try {
        const cleanerId = getParamString(req.params.cleanerId);
        const { startDate, endDate, month } = req.query;
        const records = await (0, incentives_service_1.getDailyWorkRecordsWithIncentives)(cleanerId, {
            startDate: startDate,
            endDate: endDate,
            month: month,
        });
        return res.json({
            success: true,
            data: records,
            count: records.length,
        });
    }
    catch (error) {
        console.error('GET DAILY WORK RECORDS ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch daily work records',
        });
    }
};
exports.getDailyWorkRecordsController = getDailyWorkRecordsController;
const getMonthlyIncentiveSummaryController = async (req, res) => {
    try {
        const cleanerId = getParamString(req.params.cleanerId);
        const month = getParamString(req.params.month); // Format: YYYY-MM
        const summary = await (0, incentives_service_1.getMonthlyIncentiveSummary)(cleanerId, month);
        return res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        console.error('GET MONTHLY SUMMARY ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch monthly incentive summary',
        });
    }
};
exports.getMonthlyIncentiveSummaryController = getMonthlyIncentiveSummaryController;
