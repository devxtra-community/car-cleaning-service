import { Router } from 'express';
import {
  createSalary,
  getAllSalaries,
  getMySalary,
  updateSalary,
  finalizeSalary,
} from './salary_controller';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';

const router = Router();

router.post('/', protect, allowRoles('super_admin', 'admin'), createSalary);
router.get('/', getAllSalaries);
router.get('/me', getMySalary);
router.put('/:id', updateSalary);
router.patch('/:id/finalize', finalizeSalary);
