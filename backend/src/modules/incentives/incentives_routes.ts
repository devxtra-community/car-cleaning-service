import express from 'express';
import {
  createIncentive,
  getActiveIncentive,
  updateIncentive,
  deleteIncentive,
} from './incentives_controller';

const router = express.Router();

router.post('/', createIncentive);
router.get('/', getActiveIncentive);
router.put('/:id', updateIncentive);
router.delete('/:id', deleteIncentive);

export default router;
