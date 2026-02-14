import { Request, Response } from 'express';
import {
  lockSalaryCycle,
  markSalaryAsPaid,
  generateSalaryForAllUsers,
  generateSalaryForUser,
  getAllSalaryCycles,
  getSalarySummary,
} from './salary_service';

/* ================= GENERATE SALARY FOR ONE CLEANER ================= */

type SalarySummaryMode = 'daily' | 'weekly' | 'monthly';
export const generateSalaryForCleanerController = async (req: Request, res: Response) => {
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

    const result = await generateSalaryForUser(cleanerId, cycleId);

    return res.json({
      success: true,
      message: 'Salary generated successfully for cleaner',
      data: result,
    });
  } catch (err: unknown) {
    console.error('GENERATE ERROR FULL:', err);

    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
};
/* ================= GENERATE SALARY FOR ALL CLEANERS ================= */

export const generateSalaryForAllController = async (
  req: Request<{ cycleId: string }>,
  res: Response
) => {
  try {
    const { cycleId } = req.params;

    const result = await generateSalaryForAllUsers(cycleId);

    return res.json({
      success: true,
      message: 'Salary generated successfully',
      data: result,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
};
export const getSalaryCyclesController = async (req: Request, res: Response) => {
  try {
    const cycles = await getAllSalaryCycles();

    return res.json({
      success: true,
      data: cycles,
    });
  } catch (err: unknown) {
    console.error('FETCH SALARY CYCLES ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch salary cycles',
    });
  }
};
/* ================= LOCK SALARY CYCLE ================= */

export const lockSalaryController = async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.params;

    if (!cycleId || Array.isArray(cycleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cycleId',
      });
    }

    const result = await lockSalaryCycle(cycleId);

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    console.error('LOCK SALARY ERROR:', err);

    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to lock salary cycle',
    });
  }
};

export const markSalaryPaidController = async (req: Request, res: Response) => {
  try {
    const { salaryId } = req.params;
    const { payment_method } = req.body;

    if (!salaryId || Array.isArray(salaryId)) {
      return res.status(400).json({ success: false, message: 'Invalid salaryId' });
    }

    const result = await markSalaryAsPaid(salaryId, payment_method);

    return res.json({
      success: true,
      message: 'Salary marked as paid',
      data: result,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
};

export const getSalarySummaryController = async (req: Request, res: Response) => {
  try {
    const { mode } = req.params;

    if (!mode || Array.isArray(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode',
      });
    }

    const allowedModes: SalarySummaryMode[] = ['daily', 'weekly', 'monthly'];

    if (!allowedModes.includes(mode as SalarySummaryMode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode must be daily, weekly, or monthly',
      });
    }

    const result = await getSalarySummary(mode as SalarySummaryMode);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Something went wrong',
    });
  }
};
