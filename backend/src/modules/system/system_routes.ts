import express from 'express';
import { logger } from '../../config/logger';
import { authMiddleware, AuthRequest } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

import { isMaintenanceMode, setMaintenanceMode } from './maintenance_state';

const router = express.Router();

/**
 * GET /api/admin/system/maintenance/status
 * Get the current maintenance mode status.
 */
router.get('/maintenance/status', async (req, res) => {
    try {
        res.json({ success: true, active: isMaintenanceMode });
    } catch (error) {
        logger.error('Failed to get maintenance status', { error: String(error) });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/admin/system/maintenance/toggle
 * Enable or disable maintenance mode.
 * Required role: Admin, Accountant
 */
router.post(
    '/maintenance/toggle',
    authMiddleware as any,
    allowRoles('admin', 'accountant') as any,
    async (req: AuthRequest, res) => {
        const { active } = req.body;

        if (typeof active !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Field "active" must be a boolean' });
        }

        try {
            setMaintenanceMode(active);
            return res.status(200).json({ success: true, message: 'Maintenance mode toggled', active: isMaintenanceMode });
        } catch (error) {
            logger.error('Failed to toggle maintenance mode', { error: String(error) });
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
);

export default router;
