import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../../../src/shared/middleware/auth.middleware';
import { UserRepository } from '../../../src/modules/users/user.repository';
import { TokenHelper } from '../../../src/shared/helpers/token.helper';
import { UnauthorizedError } from '../../../src/shared/errors/HttpError';
import { User } from '../../../src/modules/users/user.types';

const mockUser: User = {
  id: 'user-uuid-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone_number: '+2348012345678',
  password_hash: '$2b$10$hashed',
  token: 'dXNlci11dWlkLTE.randomhex',
  is_blacklisted: false,
  created_at: new Date(),
  updated_at: new Date(),
};

function buildMockUserRepo(): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByIdAndToken: jest.fn(),
    create: jest.fn(),
    updateToken: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

function buildMockReqRes(authHeader?: string) {
  const req = {
    headers: { authorization: authHeader },
    user: undefined,
  } as unknown as Request;
  const res = {} as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('Auth Middleware', () => {
  it('sets req.user and calls next() when token is valid', async () => {
    const token = TokenHelper.generate('user-uuid-1');
    const repo = buildMockUserRepo();
    repo.findByIdAndToken.mockResolvedValue({ ...mockUser, token });

    const middleware = createAuthMiddleware(repo);
    const { req, res, next } = buildMockReqRes(`Bearer ${token}`);

    await middleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user?.id).toBe('user-uuid-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(UnauthorizedError) when Authorization header is missing', async () => {
    const repo = buildMockUserRepo();
    const middleware = createAuthMiddleware(repo);
    const { req, res, next } = buildMockReqRes(undefined);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    const error = (next as jest.Mock).mock.calls[0][0] as UnauthorizedError;
    expect(error.statusCode).toBe(401);
  });

  it('calls next(UnauthorizedError) when header does not start with Bearer', async () => {
    const repo = buildMockUserRepo();
    const middleware = createAuthMiddleware(repo);
    const { req, res, next } = buildMockReqRes('Basic sometoken');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('calls next(UnauthorizedError) when token is not found in DB (revoked or invalid)', async () => {
    const token = TokenHelper.generate('user-uuid-1');
    const repo = buildMockUserRepo();
    repo.findByIdAndToken.mockResolvedValue(undefined);

    const middleware = createAuthMiddleware(repo);
    const { req, res, next } = buildMockReqRes(`Bearer ${token}`);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    const error = (next as jest.Mock).mock.calls[0][0] as UnauthorizedError;
    expect(error.message).toMatch(/invalid or has been revoked/i);
  });

  it('calls next(UnauthorizedError) when token format is malformed', async () => {
    const repo = buildMockUserRepo();
    const middleware = createAuthMiddleware(repo);
    const { req, res, next } = buildMockReqRes('Bearer notavalidtoken');

    // extractUserId returns null when there is no dot separator
    await middleware(req, res, next);

    // Either UnauthorizedError for bad format OR for not found in DB — both are valid 401
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
