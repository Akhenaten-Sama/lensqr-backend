import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

interface MysqlError extends Error {
  code?: string;
}

export function globalErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known application errors — safe to expose message to client
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      error_code: error.errorCode,
    });
    return;
  }

  // MySQL duplicate entry (unique constraint violation)
  const mysqlError = error as MysqlError;
  if (mysqlError.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      status: 'error',
      message: 'A resource with this identifier already exists.',
      error_code: 'DUPLICATE_ENTRY',
    });
    return;
  }

  // Unhandled / unexpected errors — never expose internals in production
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred. Please try again later.',
    error_code: 'INTERNAL_SERVER_ERROR',
  });
}
