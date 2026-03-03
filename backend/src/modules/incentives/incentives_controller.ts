// src/controllers/incentives_controller.ts
import { Request, Response } from 'express';
import {
  // Incentive Types
  createIncentiveType,
  getAllIncentiveTypes,
  getActiveIncentiveTypes,
  updateIncentiveType,
  deleteIncentiveType,
  // Incentive Rules
  createIncentiveRule,
  getAllIncentiveRules,
  getIncentiveRulesByType,
  getActiveIncentiveRules,
  updateIncentiveRule,
  deleteIncentiveRule,
  // Daily Work
  recordDailyWork,
  getDailyWorkRecordsWithIncentives,
  getMonthlyIncentiveSummary,
} from './incentives_service';
import { pool } from '../../database/connectDatabase';
import { AuthRequest } from '../../middlewares/authMiddleware';

const getParamString = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

/* ================= INCENTIVE TARGETS (simple task-count targets) ================= */

export const getAllIncentiveTargetsController = async (_: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        it.*,
        u.full_name as cleaner_name,
        b.building_name,
        f.floor_name
       FROM incentive_targets it
       LEFT JOIN cleaners c ON it.cleaner_id = c.id
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN buildings b ON it.building_id = b.id
       LEFT JOIN floors f ON it.floor_id = f.id
       ORDER BY it.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET TARGETS ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch targets' });
  }
};

export const createIncentiveTargetController = async (req: Request, res: Response) => {
  try {
    const { target_tasks, reason, incentive_amount, cleaner_id, building_id, floor_id } = req.body;
    if (!reason || target_tasks === undefined || incentive_amount === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const result = await pool.query(
      `INSERT INTO incentive_targets (reason, target_tasks, incentive_amount, active, cleaner_id, building_id, floor_id)
       VALUES ($1, $2, $3, true, $4, $5, $6) RETURNING *`,
      [reason, Number(target_tasks), Number(incentive_amount), cleaner_id || null, building_id || null, floor_id || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('CREATE TARGET ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to create target' });
  }
};

export const updateIncentiveTargetController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_tasks, reason, incentive_amount, cleaner_id, building_id, floor_id, active } = req.body;
    const result = await pool.query(
      `UPDATE incentive_targets
       SET reason = COALESCE($1, reason),
           target_tasks = COALESCE($2, target_tasks),
           incentive_amount = COALESCE($3, incentive_amount),
           cleaner_id = COALESCE($4, cleaner_id),
           building_id = COALESCE($5, building_id),
           floor_id = COALESCE($6, floor_id),
           active = COALESCE($7, active),
           updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [
        reason,
        target_tasks !== undefined ? Number(target_tasks) : undefined,
        incentive_amount !== undefined ? Number(incentive_amount) : undefined,
        cleaner_id || null,
        building_id || null,
        floor_id || null,
        active,
        id
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('UPDATE TARGET ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to update target' });
  }
};

export const deleteIncentiveTargetController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM incentive_targets WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Target deleted' });
  } catch (err) {
    console.error('DELETE TARGET ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete target' });
  }
};

/* ================= INCENTIVE TYPES ================= */

export const createIncentiveTypeController = async (req: Request, res: Response) => {
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

    const incentiveType = await createIncentiveType({
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
  } catch (error) {
    console.error('CREATE INCENTIVE TYPE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create incentive type',
    });
  }
};

export const getAllIncentiveTypesController = async (_: Request, res: Response) => {
  try {
    const incentiveTypes = await getAllIncentiveTypes();

    return res.json({
      success: true,
      data: incentiveTypes,
      count: incentiveTypes.length,
    });
  } catch (error) {
    console.error('GET ALL INCENTIVE TYPES ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive types',
    });
  }
};

export const getActiveIncentiveTypesController = async (_: Request, res: Response) => {
  try {
    const incentiveTypes = await getActiveIncentiveTypes();

    return res.json({
      success: true,
      data: incentiveTypes,
      count: incentiveTypes.length,
    });
  } catch (error) {
    console.error('GET ACTIVE INCENTIVE TYPES ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active incentive types',
    });
  }
};

export const updateIncentiveTypeController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    const { name, category, calculation_type, description, active } = req.body;

    const incentiveType = await updateIncentiveType(id, {
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
  } catch (error: unknown) {
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

export const deleteIncentiveTypeController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    await deleteIncentiveType(id);

    return res.json({
      success: true,
      message: 'Incentive type deleted successfully',
    });
  } catch (error: unknown) {
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

/* ================= INCENTIVE RULES ================= */

export const createIncentiveRuleController = async (req: AuthRequest, res: Response) => {
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

    const rule = await createIncentiveRule({
      incentive_type_id,
      rule_name,
      base_amount: Number(base_amount),
      criteria: sanitizedCriteria,
      priority: priority !== undefined ? Number(priority) : 0,
    });

    if (active !== undefined) {
      await updateIncentiveRule(rule.id, { active });
    }

    return res.status(201).json({ success: true, data: rule });
  } catch (err: unknown) {
    console.error('CREATE RULE ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create incentive rule',
    });
  }
};

export const getAllIncentiveRulesController = async (_: Request, res: Response) => {
  try {
    const incentiveRules = await getAllIncentiveRules();

    return res.json({
      success: true,
      data: incentiveRules,
      count: incentiveRules.length,
    });
  } catch (error) {
    console.error('GET ALL INCENTIVE RULES ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive rules',
    });
  }
};

export const getIncentiveRulesByTypeController = async (req: Request, res: Response) => {
  try {
    const typeId = getParamString(req.params.typeId);
    const rules = await getIncentiveRulesByType(typeId);

    return res.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    console.error('GET RULES BY TYPE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive rules',
    });
  }
};

export const getActiveIncentiveRulesController = async (_: Request, res: Response) => {
  try {
    const rules = await getActiveIncentiveRules();

    return res.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    console.error('GET ACTIVE RULES ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active incentive rules',
    });
  }
};

export const updateIncentiveRuleController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    const { rule_name, base_amount, criteria, priority, active } = req.body;

    const incentiveRule = await updateIncentiveRule(id, {
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
  } catch (error: unknown) {
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

export const deleteIncentiveRuleController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    await deleteIncentiveRule(id);

    return res.json({
      success: true,
      message: 'Incentive rule deleted successfully',
    });
  } catch (error: unknown) {
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

/* ================= DAILY WORK ================= */

export const recordDailyWorkController = async (req: Request, res: Response) => {
  try {
    const {
      cleaner_id,
      date,
      tasks_completed,
      hours_worked,
      is_overtime,
      is_weekend,
      customer_rating,
      hourly_rate,
      notes,
    } = req.body;

    if (!cleaner_id || !date || tasks_completed === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cleaner_id, date, tasks_completed',
      });
    }

    const result = await recordDailyWork({
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
  } catch (error: unknown) {
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

export const getDailyWorkRecordsController = async (req: Request, res: Response) => {
  try {
    const cleanerId = getParamString(req.params.cleanerId);
    const { startDate, endDate, month } = req.query;

    const records = await getDailyWorkRecordsWithIncentives(cleanerId, {
      startDate: startDate as string,
      endDate: endDate as string,
      month: month as string,
    });

    return res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error('GET DAILY WORK RECORDS ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch daily work records',
    });
  }
};

export const getMonthlyIncentiveSummaryController = async (req: Request, res: Response) => {
  try {
    const cleanerId = getParamString(req.params.cleanerId);
    const month = getParamString(req.params.month); // Format: YYYY-MM

    const summary = await getMonthlyIncentiveSummary(cleanerId, month);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('GET MONTHLY SUMMARY ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly incentive summary',
    });
  }
};
