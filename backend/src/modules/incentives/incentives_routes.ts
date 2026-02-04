import express from 'express';
import {
  createIncentive,
  getIncentives,
  updateIncentive,
  deleteIncentive,
} from './incentives_controller';

const router = express.Router();

router.post('/', createIncentive);
router.get('/', getIncentives);
router.put('/:id', updateIncentive);
router.delete('/:id', deleteIncentive);

export default router;
