import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, data: T, message: string, statusCode = 200): void {
    res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  }

  static created<T>(res: Response, data: T, message: string): void {
    ApiResponse.success(res, data, message, 201);
  }
}
