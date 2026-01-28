import { Router } from 'express';
import {
  createSalary,
  getAllSalaries,
  getMySalary,
  updateSalary,
  finalizeSalary,
} from './salary_controller';

const router = Router();

router.post('/', createSalary);
router.get('/', getAllSalaries);
router.get('/me', getMySalary);
router.put('/:id', updateSalary);
router.patch('/:id/finalize', finalizeSalary);
