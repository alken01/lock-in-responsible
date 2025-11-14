import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode, err.details);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return sendError(res, 'DATABASE_ERROR', 'Database operation failed', 500);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, 'VALIDATION_ERROR', err.message, 400);
  }

  // Default error response
  return sendError(
    res,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, 'NOT_FOUND', `Route ${req.path} not found`, 404);
};
