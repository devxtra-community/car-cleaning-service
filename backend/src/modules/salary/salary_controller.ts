import { Request, Response } from 'express';
import {
  createSalary,
  getAllSalaries,
  getSalaryByUser,
  updateSalary,
  finalizeSalary,
} from './salary_service';
import { logger } from '../../config/logger';
import { AuthRequest } from '../../middlewares/authMiddleware';

/**
 * Small helper to safely extract string params
 */
const getString = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('PARAM_MISSING');
  }
  return Array.isArray(value) ? value[0] : value;
};

/**
 * CREATE salary
 */
export const createSalaryController = async (req: Request, res: Response) => {
  try {
    const { user_id, salary_month, base_salary, total_work, incentive_amount, penalty_amount } =
      req.body;

    if (!user_id || !salary_month || !base_salary) {
      return res.status(400).json({
        success: false,
        message: 'user_id, salary_month and base_salary are required',
      });
    }

    const salary = await createSalary({
      user_id,
      salary_month,
      base_salary,
      total_work,
      incentive_amount,
      penalty_amount,
      generated_by: null, // no accountant yet
    });

    return res.status(201).json({
      success: true,
      data: salary,
    });
  } catch (err) {
    logger.error('Create salary failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to create salary',
    });
  }
};

/**
 * GET all salaries
 */
export const getAllSalariesController = async (_req: Request, res: Response) => {
  try {
    const salaries = await getAllSalaries();

    return res.status(200).json({
      success: true,
      data: salaries,
    });
  } catch (err) {
    logger.error('Fetch salaries failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch salaries',
    });
  }
};

/**
 * GET my salary (cleaner)
 */
export const getMySalaryController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getString(req.user?.userId);

    const salaries = await getSalaryByUser(userId);

    return res.status(200).json({
      success: true,
      data: salaries,
    });
  } catch (err) {
    logger.error('Fetch my salary failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch salary',
    });
  }
};

/**
 * UPDATE salary (draft only)
 */
export const updateSalaryController = async (req: Request, res: Response) => {
  try {
    const salaryId = getString(req.params.id);

    const { base_salary, incentive_amount, penalty_amount } = req.body;

    const salary = await updateSalary(salaryId, {
      base_salary,
      incentive_amount,
      penalty_amount,
    });

    return res.status(200).json({
      success: true,
      data: salary,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'SALARY_LOCKED') {
      return res.status(400).json({
        success: false,
        message: 'Salary already finalized',
      });
    }

    logger.error('Update salary failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to update salary',
    });
  }
};

/**
 * FINALIZE salary
 */
export const finalizeSalaryController = async (req: Request, res: Response) => {
  try {
    const salaryId = getString(req.params.id);

    const salary = await finalizeSalary(salaryId);

    if (!salary) {
      return res.status(400).json({
        success: false,
        message: 'Salary already finalized or not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: salary,
    });
  } catch (err) {
    logger.error('Finalize salary failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to finalize salary',
    });
  }
};
