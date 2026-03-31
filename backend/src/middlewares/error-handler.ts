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
  } else if (err instanceof Error) {
    // Mapping for common string-based errors from legacy services
    const errorMappings: Record<string, { status: number; code: string }> = {
      CYCLE_NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
      SALARY_CYCLE_LOCKED: { status: 403, code: 'FORBIDDEN' },
      USER_NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
      CLEANER_PROFILE_NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
      NO_LOCKED_SALARIES_FOUND_FOR_PAYOUT: { status: 400, code: 'BAD_REQUEST' },
      'Invalid credentials': { status: 401, code: 'UNAUTHORIZED' },
      'Refresh token missing': { status: 401, code: 'UNAUTHORIZED' },
    };

    const mapping = errorMappings[err.message];
    if (mapping) {
      statusCode = mapping.status;
      code = mapping.code;
      message = err.message;
    } else {
      message = err.message;
    }
  }

  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    statusCode,
    code,
    errorMessage: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
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
