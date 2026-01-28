import { Router } from 'express';
import {
  createSalaryController,
  getAllSalariesController,
  getMySalaryController,
  updateSalaryController,
  finalizeSalaryController,
} from './salary_controller';

const router = Router();

/**
 * CREATE salary
 * (admin / system – no accountant yet)
 */
router.post('/', createSalaryController);

/**
 * GET all salaries
 * (admin / accountant view)
 */
router.get('/', getAllSalariesController);

/**
 * GET logged-in user's salary
 * (cleaner view)
 */
router.get('/me', getMySalaryController);

/**
 * UPDATE salary (draft only)
 */
router.put('/:id', updateSalaryController);

/**
 * FINALIZE salary
 */
router.patch('/:id/finalize', finalizeSalaryController);

export default router;
