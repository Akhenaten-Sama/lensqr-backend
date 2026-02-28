import { Router } from 'express';
import { UserController } from './user.controller';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validate } from '../../shared/middleware/validate.middleware';
import { createUserSchema, loginSchema } from './user.validator';

export function createUserRouter(
  userController: UserController,
  authenticate: ReturnType<typeof import('../../shared/middleware/auth.middleware').createAuthMiddleware>,
): Router {
  const router = Router();

  router.post('/', validate(createUserSchema), asyncHandler(userController.register.bind(userController)));

  router.post('/login', validate(loginSchema), asyncHandler(userController.login.bind(userController)));

  router.get('/me', authenticate, asyncHandler(userController.getProfile.bind(userController)));

  return router;
}
