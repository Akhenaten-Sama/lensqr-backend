import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BadRequestError } from '../errors/HttpError';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: Joi.ObjectSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      throw new BadRequestError(message);
    }

    // Replace the request target with the stripped/coerced value
    req[target] = value;
    next();
  };
}
