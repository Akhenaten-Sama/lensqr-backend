import { AppError } from './AppError';

export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'BAD_REQUEST';
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode: string;

  constructor(message: string, errorCode = 'FORBIDDEN') {
    super(message);
    this.errorCode = errorCode;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'RESOURCE_NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
}

export class UnprocessableEntityError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'UNPROCESSABLE_ENTITY';
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
}
