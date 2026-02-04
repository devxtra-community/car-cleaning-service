import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: token missing',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY!) as {
      userId: string;
      role: string;
    };

    req.user = decoded;

    // ✅ LOG AFTER ASSIGN
    console.log('USER FROM TOKEN:', req.user);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid token',
      err,
    });
  }
};
