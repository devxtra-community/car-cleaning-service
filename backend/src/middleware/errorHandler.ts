import { Request, Response, NextFunction } from 'express';
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[System Error]:', err.message || err);
  // Status mapping table for custom string errors
  const errorMappings: Record<string, number> = {
    CYCLE_NOT_FOUND: 404,
    SALARY_CYCLE_LOCKED: 403,
    USER_NOT_FOUND: 404,
    CLEANER_PROFILE_NOT_FOUND: 404,
    NO_LOCKED_SALARIES_FOUND_FOR_PAYOUT: 400,
  };
  const status = errorMappings[err.message] || 500;

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && status === 500 && { details: err.stack }),
  });
};
