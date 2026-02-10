// src/controllers/salary_controller.ts
import { Request, Response } from 'express';
import {
  createSalary,
  getAllSalaries,
  getUserSalaryDetails,
  updateSalary,
  finalizeSalary,
  getUsersByRole,
  getSalariesByUser,
} from './salary_service';
import { logger } from '../../config/logger';

/**
 * Helper to extract string params
 */
const getString = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new Error('PARAM_MISSING');
  }
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Helper to extract query string
 */
const getQueryString = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
};

/* =========================
   CREATE salary
   ========================= */
export const createSalaryController = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      month,
      base_salary,
      total_tasks,
      penalty_amount,
      monthly_review,
      payment_method,
      bank_account,
    } = req.body;

    if (!user_id || !month || base_salary === undefined) {
      return res.status(400).json({
        success: false,
        message: 'user_id, month and base_salary are required',
      });
    }

    const salary = await createSalary({
      user_id,
      month,
      base_salary: Number(base_salary),
      total_tasks: total_tasks !== undefined ? Number(total_tasks) : 0,
      penalty_amount: penalty_amount !== undefined ? Number(penalty_amount) : 0,
      monthly_review,
      payment_method,
      bank_account,
    });

    return res.status(201).json({
      success: true,
      data: salary,
      message: 'Salary created successfully',
    });
  } catch (err: unknown) {
    logger.error('Create salary failed', { err });

    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create salary',
    });
  }
};

/* =========================
   GET all salaries
   ========================= */
export const getAllSalariesController = async (_req: Request, res: Response) => {
  try {
    const salaries = await getAllSalaries();

    return res.status(200).json({
      success: true,
      data: salaries,
    });
  } catch (err: unknown) {
    logger.error('Fetch salaries failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch salaries',
    });
  }
};

/* =========================
   GET salaries by user
   ========================= */
export const getSalariesByUserController = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);

    const salaries = await getSalariesByUser(userId);

    res.status(200).json({
      success: true,
      data: salaries,
    });
  } catch (err: unknown) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salaries for user',
    });
  }
};

/* =========================
   GET user salary details
   ========================= */
export const getUserSalaryDetailsController = async (req: Request, res: Response) => {
  try {
    const userId = getString(req.params.userId);
    const month = getQueryString(req.query.month);

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'month query parameter is required (format: YYYY-MM)',
      });
    }

    const details = await getUserSalaryDetails(userId, month);

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (err: unknown) {
    logger.error('Fetch user salary details failed', { err });

    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user salary details',
    });
  }
};

export const getUsersByRoleController = async (req: Request, res: Response) => {
  try {
    const role = getQueryString(req.query.role);

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'role query parameter is required',
      });
    }

    const users = await getUsersByRole(role);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err: unknown) {
    logger.error('Fetch users by role failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

export const updateSalaryController = async (req: Request, res: Response) => {
  try {
    const salaryId = getString(req.params.id);

    const { base_salary, penalty_amount, monthly_review, payment_method, bank_account } = req.body;

    const salary = await updateSalary(salaryId, {
      base_salary: base_salary ? parseFloat(base_salary) : undefined,
      penalty_amount: penalty_amount ? parseFloat(penalty_amount) : undefined,
      monthly_review,
      payment_method,
      bank_account,
    });

    return res.status(200).json({
      success: true,
      data: salary,
      message: 'Salary updated successfully',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SALARY_LOCKED') {
      return res.status(400).json({
        success: false,
        message: 'Salary already finalized',
      });
    }

    if (err instanceof Error && err.message === 'SALARY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Salary not found',
      });
    }

    logger.error('Update salary failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to update salary',
    });
  }
};

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
      message: 'Salary finalized successfully',
    });
  } catch (err: unknown) {
    logger.error('Finalize salary failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Failed to finalize salary',
    });
  }
};
