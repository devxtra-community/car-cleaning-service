import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function globalErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }

  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    statusCode,
    code,
    error: err,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  });
}
