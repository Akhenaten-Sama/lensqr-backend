import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../../modules/users/user.repository';
import { TokenHelper } from '../helpers/token.helper';
import { UnauthorizedError } from '../errors/HttpError';

export function createAuthMiddleware(userRepo: UserRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or malformed Authorization header.');
      }

      const token = authHeader.slice(7);
      const userId = TokenHelper.extractUserId(token);

      if (!userId) {
        throw new UnauthorizedError('Invalid token format.');
      }

      const user = await userRepo.findByIdAndToken(userId, token);

      if (!user) {
        throw new UnauthorizedError('Token is invalid or has been revoked.');
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
