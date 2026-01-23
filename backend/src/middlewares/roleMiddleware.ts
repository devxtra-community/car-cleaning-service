import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
export const allowRoles =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: no role found',
      });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${userRole}' is not allowed`,
      });
    }

    next();
  };
