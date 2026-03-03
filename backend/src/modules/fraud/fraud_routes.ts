import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';
import { getPendingFraudCases, updateFraudStatus } from './fraud_controller';

const router = express.Router();

router.get(
    '/pending',
    protect,
    allowRoles('supervisor', 'admin', 'super_admin'),
    getPendingFraudCases
);

router.patch(
    '/:id/status',
    protect,
    allowRoles('supervisor', 'admin', 'super_admin'),
    updateFraudStatus
);

export default router;
