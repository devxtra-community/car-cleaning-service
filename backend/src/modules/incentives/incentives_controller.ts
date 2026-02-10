import { Request, Response } from 'express';
import {
  createIncentiveTarget,
  updateIncentiveTarget,
  deleteIncentiveTarget,
  recordDailyWork,
  getDailyWorkRecords,
  getMonthlyIncentiveSummary,
  getAllCleanersMonthlyIncentives,
  deleteDailyWorkRecord,
  getActiveIncentive,
} from './incentives_service';

const getQueryString = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
};

const getParamString = (value: string | string[]): string => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export const createIncentiveController = async (req: Request, res: Response) => {
  try {
    const { target_tasks, reason, incentive_amount } = req.body;

    if (!target_tasks || !reason || !incentive_amount) {
      return res.status(400).json({
        message: 'Missing required fields: target_tasks, reason, incentive_amount',
      });
    }

    if (target_tasks <= 0 || incentive_amount <= 0) {
      return res.status(400).json({
        message: 'target_tasks and incentive_amount must be positive numbers',
      });
    }

    const incentive = await createIncentiveTarget({
      target_tasks: Number(target_tasks),
      reason: String(reason),
      incentive_amount: Number(incentive_amount),
    });

    res.status(201).json({
      success: true,
      data: incentive,
      message: 'Incentive target created successfully',
    });
  } catch (error: unknown) {
    console.error('CREATE INCENTIVE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create incentive target',
    });
  }
};

export const getActiveIncentiveController = async (_: Request, res: Response) => {
  try {
    const incentive = await getActiveIncentive();

    res.json({
      success: true,
      data: incentive,
    });
  } catch (error: unknown) {
    console.error('GET ACTIVE INCENTIVE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active incentive',
    });
  }
};

export const getAllIncentivesController = async (_: Request, res: Response) => {
  try {
    const incentives = await getActiveIncentive();

    res.json({
      success: true,
      data: incentives,
    });
  } catch (error: unknown) {
    console.error('GET ALL INCENTIVES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incentives',
    });
  }
};

export const updateIncentiveController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    const { target_tasks, reason, incentive_amount } = req.body;

    const updateData: {
      target_tasks?: number;
      reason?: string;
      incentive_amount?: number;
    } = {};

    if (target_tasks !== undefined) updateData.target_tasks = Number(target_tasks);
    if (reason !== undefined) updateData.reason = String(reason);
    if (incentive_amount !== undefined) updateData.incentive_amount = Number(incentive_amount);

    const incentive = await updateIncentiveTarget(id, updateData);

    res.json({
      success: true,
      data: incentive,
      message: 'Incentive target updated successfully',
    });
  } catch (error: unknown) {
    console.error('UPDATE INCENTIVE ERROR:', error);

    if (error instanceof Error && error.message === 'INCENTIVE_TARGET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Incentive target not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update incentive target',
    });
  }
};

export const deleteIncentiveController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);

    await deleteIncentiveTarget(id);

    res.json({
      success: true,
      message: 'Incentive target deleted successfully',
    });
  } catch (error: unknown) {
    console.error('DELETE INCENTIVE ERROR:', error);

    if (error instanceof Error && error.message === 'INCENTIVE_TARGET_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Incentive target not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete incentive target',
    });
  }
};

export const recordDailyWorkController = async (req: Request, res: Response) => {
  try {
    const { cleaner_id, date, tasks_completed, notes } = req.body;

    if (!cleaner_id || !date || tasks_completed === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: cleaner_id, date, tasks_completed',
      });
    }

    if (tasks_completed < 0) {
      return res.status(400).json({
        message: 'tasks_completed must be a non-negative number',
      });
    }

    const record = await recordDailyWork({
      cleaner_id: String(cleaner_id),
      date: String(date),
      tasks_completed: Number(tasks_completed),
      notes: notes ? String(notes) : undefined,
    });

    res.status(201).json({
      success: true,
      data: record,
      message: 'Daily work recorded successfully',
    });
  } catch (error: unknown) {
    console.error('RECORD DAILY WORK ERROR:', error);

    if (error instanceof Error && error.message === 'NO_ACTIVE_INCENTIVE_TARGET') {
      return res.status(400).json({
        success: false,
        message: 'No active incentive target found. Please create one first.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record daily work',
    });
  }
};

export const getDailyWorkRecordsController = async (req: Request, res: Response) => {
  try {
    const cleanerId = getParamString(req.params.cleanerId);

    const startDate = getQueryString(req.query.startDate);
    const endDate = getQueryString(req.query.endDate);
    const month = getQueryString(req.query.month);

    const filters: {
      startDate?: string;
      endDate?: string;
      month?: string;
    } = {};

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (month) filters.month = month;

    const records = await getDailyWorkRecords(cleanerId, filters);

    res.json({
      success: true,
      data: records,
    });
  } catch (error: unknown) {
    console.error('GET DAILY WORK RECORDS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily work records',
    });
  }
};

export const getMonthlyIncentiveSummaryController = async (req: Request, res: Response) => {
  try {
    const cleanerId = getParamString(req.params.cleanerId);
    const month = getQueryString(req.query.month);

    if (!month) {
      return res.status(400).json({
        message: 'Missing required query parameter: month (format: YYYY-MM)',
      });
    }

    const summary = await getMonthlyIncentiveSummary(cleanerId, month);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    console.error('GET MONTHLY INCENTIVE SUMMARY ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly incentive summary',
    });
  }
};

export const getAllCleanersMonthlyIncentivesController = async (req: Request, res: Response) => {
  try {
    const month = getQueryString(req.query.month);

    if (!month) {
      return res.status(400).json({
        message: 'Missing required query parameter: month (format: YYYY-MM)',
      });
    }

    const summaries = await getAllCleanersMonthlyIncentives(month);

    res.json({
      success: true,
      data: summaries,
    });
  } catch (error: unknown) {
    console.error('GET ALL CLEANERS MONTHLY INCENTIVES ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly incentive summaries',
    });
  }
};

export const deleteDailyWorkRecordController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    const cleanerId = getQueryString(req.query.cleanerId);

    if (!cleanerId) {
      return res.status(400).json({
        message: 'Missing required query parameter: cleanerId',
      });
    }

    await deleteDailyWorkRecord(id, cleanerId);

    res.json({
      success: true,
      message: 'Daily work record deleted successfully',
    });
  } catch (error: unknown) {
    console.error('DELETE DAILY WORK RECORD ERROR:', error);

    if (error instanceof Error && error.message === 'WORK_RECORD_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Work record not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete work record',
    });
  }
};
