import { Router } from 'express';
import { getReconciliationController } from './reconciliation_controller';

const router = Router();
router.get('/reconciliation/:cycleId', getReconciliationController);

export default router;
