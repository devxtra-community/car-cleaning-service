import { Request, Response } from 'express';
import {
  createIncentiveTarget,
  updateIncentiveTarget,
  deleteIncentiveTarget,
  getActiveIncentive,
  getAllIncentives, // ✅ Added this
} from './incentives_service';

/* ================= HELPERS ================= */

// const getQueryString = (value: unknown): string | undefined => {
//   if (!value) return undefined;
//   if (typeof value === 'string') return value;
//   if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
//   return undefined;
// };

const getParamString = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

/* ================= INCENTIVE TARGET ================= */

export const createIncentiveController = async (req: Request, res: Response) => {
  try {
    const { target_tasks, reason, incentive_amount } = req.body;

    if (!target_tasks || !reason || !incentive_amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: target_tasks, reason, incentive_amount',
      });
    }

    if (Number(target_tasks) <= 0 || Number(incentive_amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'target_tasks and incentive_amount must be positive numbers',
      });
    }

    const incentive = await createIncentiveTarget({
      target_tasks: Number(target_tasks),
      reason: String(reason),
      incentive_amount: Number(incentive_amount),
    });

    return res.status(201).json({
      success: true,
      data: incentive,
      message: 'Incentive target created successfully',
    });
  } catch (error) {
    console.error('CREATE INCENTIVE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create incentive target',
    });
  }
};

export const getActiveIncentiveController = async (_: Request, res: Response) => {
  try {
    const incentive = await getActiveIncentive();

    return res.json({
      success: true,
      data: incentive,
    });
  } catch (error) {
    console.error('GET ACTIVE INCENTIVE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active incentive',
    });
  }
};

export const getAllIncentivesController = async (_: Request, res: Response) => {
  try {
    const incentives = await getAllIncentives(); // ✅ FIXED

    return res.json({
      success: true,
      data: incentives,
      count: incentives.length,
    });
  } catch (error) {
    console.error('GET ALL INCENTIVES ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incentives',
    });
  }
};

export const updateIncentiveController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);
    const { target_tasks, reason, incentive_amount } = req.body;

    const updateData: Record<string, unknown> = {};

    if (target_tasks !== undefined) updateData.target_tasks = Number(target_tasks);

    if (reason !== undefined) updateData.reason = String(reason);

    if (incentive_amount !== undefined) updateData.incentive_amount = Number(incentive_amount);

    const incentive = await updateIncentiveTarget(id, updateData);

    return res.json({
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

    return res.status(500).json({
      success: false,
      message: 'Failed to update incentive target',
    });
  }
};

export const deleteIncentiveController = async (req: Request, res: Response) => {
  try {
    const id = getParamString(req.params.id);

    await deleteIncentiveTarget(id);

    return res.json({
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

    return res.status(500).json({
      success: false,
      message: 'Failed to delete incentive target',
    });
  }
};
