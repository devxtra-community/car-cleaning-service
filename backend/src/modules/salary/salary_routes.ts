// src/routes/salary.routes.ts
import { Router } from 'express';
import {
  createSalaryController,
  getAllSalariesController,
  getUserSalaryDetailsController,
  getUsersByRoleController,
  updateSalaryController,
  finalizeSalaryController,
  getSalariesByUserController,
} from './salary_controller';

const router = Router();

/**
 * CREATE salary
 */
router.post('/', createSalaryController);

/**
 * GET all salaries
 */
router.get('/', getAllSalariesController);

/**
 * GET logged-in user's salary
 */
router.get('/user/:userId', getSalariesByUserController);

/**
 * GET users by role
 * Query: ?role=worker|accountant|supervisor
 */
router.get('/users-by-role', getUsersByRoleController);

/**
 * GET user salary details with monthly breakdown
 * Query: ?month=YYYY-MM
 */
router.get('/user/:userId/details', getUserSalaryDetailsController);

/**
 * UPDATE salary (draft only)
 */
router.put('/:id', updateSalaryController);

/**
 * FINALIZE salary
 */
router.patch('/:id/finalize', finalizeSalaryController);

export default router;
