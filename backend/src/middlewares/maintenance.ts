import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { isMaintenanceMode } from '../modules/system/maintenance_state';

/**
 * Global middleware to handle system-wide maintenance mode.
 * When active, all endpoints (except specifically excluded ones) will return 503 Service Unavailable.
 */
export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Exclude specific routes that should always be accessible
  // (e.g., Health check, System control, static assets)
  const excludedPaths = [
    '/health',
    '/test',
    '/api/admin/system/maintenance', // Toggle endpoint
    '/uploads',
  ];

  if (excludedPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  try {
    if (isMaintenanceMode) {
      logger.warn(`Access blocked due to Maintenance Mode: ${req.method} ${req.url}`);
      return res.status(503).json({
        success: false,
        message: 'System is currently under maintenance. Please try again later.',
        retryAfter: 3600, // Estimate 1 hour
      });
    }

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error checking maintenance mode status:', { error: errorMessage });
    // Fail-safe: allow requests if the check itself fails, unless we want to be paranoid
    next();
  }
};
