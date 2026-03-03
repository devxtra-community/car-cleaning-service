import express from 'express';
import redis from '../../config/redis';
import { logger } from '../../config/logger';
import { authMiddleware, AuthRequest } from '../../middlewares/authMiddleware';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = express.Router();

/**
 * GET /api/admin/system/maintenance/status
 * Get the current maintenance mode status.
 */
router.get('/maintenance/status', async (req, res) => {
    try {
        let active = false;
        if (redis && redis.status === 'ready') {
            const flag = await redis.get('system:maintenance_mode');
            active = flag === 'true';
        } else {
            active = process.env.MAINTENANCE_MODE === 'true';
        }

        res.json({ success: true, active });
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
    allowRoles('Admin', 'Accountant') as any,
    async (req: AuthRequest, res) => {
        const { active } = req.body;

        if (typeof active !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Field "active" must be a boolean' });
        }

        try {
            if (redis && redis.status === 'ready') {
                await redis.set('system:maintenance_mode', active ? 'true' : 'false');
                logger.warn(`Maintenance mode ${active ? 'ENABLED' : 'DISABLED'} by admin ID: ${req.user?.userId}`);
            } else {
                return res.status(503).json({ success: false, message: 'Redis is not available to toggle maintenance mode' });
            }

            res.json({ success: true, message: `Maintenance mode ${active ? 'enabled' : 'disabled'}` });
        } catch (error) {
            logger.error('Failed to toggle maintenance mode', { error: String(error) });
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
);

export default router;
