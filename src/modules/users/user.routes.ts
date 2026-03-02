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

  /**
   * @openapi
   * /users:
   *   post:
   *     tags: [Users]
   *     summary: Register a new user
   *     description: >
   *       Creates a new user account and a corresponding wallet. The provided email is
   *       checked against the Lendsqr Adjutor Karma blacklist before registration proceeds.
   *       Returns a faux auth token to use in subsequent requests.
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserRequest'
   *     responses:
   *       201:
   *         description: Account created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Account created successfully.
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/PublicUser'
   *                     wallet:
   *                       type: object
   *                       properties:
   *                         id: { type: string }
   *                         balance: { type: string, example: '0.00' }
   *                         currency: { type: string, example: NGN }
   *                     token:
   *                       type: string
   *                       example: dXNlci11dWlkLTE.randomhex
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       403:
   *         description: Identity is on the Karma blacklist
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: error
   *               message: Account creation not allowed. This identity is on the Karma blacklist.
   *               error_code: USER_BLACKLISTED
   *       409:
   *         description: Email already registered
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: error
   *               message: An account with this email address already exists.
   *               error_code: CONFLICT
   */
  router.post('/', validate(createUserSchema), asyncHandler(userController.register.bind(userController)));

  /**
   * @openapi
   * /users/login:
   *   post:
   *     tags: [Users]
   *     summary: Login
   *     description: Validates credentials and returns a fresh faux auth token.
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Login successful.
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/PublicUser'
   *                     token:
   *                       type: string
   *                       example: dXNlci11dWlkLTE.randomhex
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post('/login', validate(loginSchema), asyncHandler(userController.login.bind(userController)));

  /**
   * @openapi
   * /users/me:
   *   get:
   *     tags: [Users]
   *     summary: Get authenticated user's profile
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/PublicUser'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.get('/me', authenticate, asyncHandler(userController.getProfile.bind(userController)));

  return router;
}
