import { Request, Response } from 'express';
import * as salaryService from './salary_service';
import { UserRole } from '../../database/schema/usersSchema';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    client_type: 'web' | 'mobile';
  };
}

/**
 * Helper to safely extract route param
 */
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

/**
 * CREATE salary (Admin / Accountant)
 */
export const createSalary = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['admin', 'accountant'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const salary = await salaryService.createSalary({
    ...req.body,
    generated_by: req.user.userId,
  });

  return res.status(201).json(salary);
};

/**
 * GET all salaries (Admin / Accountant)
 */
export const getAllSalaries = async (_req: Request, res: Response) => {
  const salaries = await salaryService.getAllSalaries();
  return res.json(salaries);
};

/**
 * GET own salary (Cleaner)
 */
export const getMySalary = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const salaries = await salaryService.getSalaryByCleaner(req.user.userId);
  return res.json(salaries);
};

/**
 * UPDATE salary (Accountant only, draft only)
 */
export const updateSalary = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'accountant') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const salaryId = getParam(req.params.id);

  try {
    const salary = await salaryService.updateSalary(salaryId, req.body);
    return res.json(salary);
  } catch (err) {
    if (err instanceof Error && err.message === 'SALARY_LOCKED') {
      return res.status(400).json({ message: 'Salary already finalized' });
    }
    throw err;
  }
};

/**
 * FINALIZE salary (Accountant only)
 */
export const finalizeSalary = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'accountant') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const salaryId = getParam(req.params.id);

  const salary = await salaryService.finalizeSalary(salaryId, req.user.userId);

  return res.json(salary);
};
