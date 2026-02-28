import bcrypt from 'bcryptjs';
import { UserService } from '../../../src/modules/users/user.service';
import { UserRepository } from '../../../src/modules/users/user.repository';
import { AdjutorService } from '../../../src/integrations/adjutor/adjutor.service';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../../src/shared/errors/HttpError';
import { User } from '../../../src/modules/users/user.types';

jest.mock('bcryptjs');
jest.mock('uuid', () => ({ v4: jest.fn(() => 'generated-uuid') }));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function buildMockUserRepo(): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByIdAndToken: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
    updateToken: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UserRepository>;
}

function buildMockWalletRepo() {
  return { create: jest.fn().mockResolvedValue(undefined) };
}

function buildMockAdjutorService(): jest.Mocked<AdjutorService> {
  return {
    isBlacklisted: jest.fn().mockResolvedValue(false),
  } as unknown as jest.Mocked<AdjutorService>;
}

function buildMockDb(trxResult?: Partial<UserRepository>) {
  const trx = {
    ...buildMockUserRepo(),
    ...trxResult,
  };
  return jest.fn().mockImplementation((cb: (t: unknown) => unknown) => cb(trx));
}

const baseDto = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone_number: '+2348012345678',
  password: 'SecurePass123',
};

const mockStoredUser: User = {
  id: 'generated-uuid',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone_number: '+2348012345678',
  password_hash: '$2b$10$hashed',
  token: 'token.abc',
  is_blacklisted: false,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

describe('UserService - createUser', () => {
  let userRepo: jest.Mocked<UserRepository>;
  let walletRepo: ReturnType<typeof buildMockWalletRepo>;
  let adjutorService: jest.Mocked<AdjutorService>;

  beforeEach(() => {
    userRepo = buildMockUserRepo();
    walletRepo = buildMockWalletRepo();
    adjutorService = buildMockAdjutorService();
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
  });

  it('creates a user and wallet and returns public user + token on success', async () => {
    userRepo.findByEmail.mockResolvedValue(undefined);
    userRepo.findById.mockResolvedValue(mockStoredUser);

    const mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (trx: unknown) => unknown) => {
        return cb({});
      }),
    };

    // Override userRepo inside transaction to return the mock user
    userRepo.findById.mockResolvedValue(mockStoredUser);

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);
    const result = await service.createUser(baseDto);

    expect(result.user.email).toBe('john@example.com');
    expect(result.wallet.balance).toBe('0.00');
    expect(result.wallet.currency).toBe('NGN');
    expect(result.token).toBeDefined();
    // password_hash must NOT be in the result
    expect((result.user as Record<string, unknown>).password_hash).toBeUndefined();
  });

  it('does not call adjutorService when email already exists (short-circuit)', async () => {
    userRepo.findByEmail.mockResolvedValue(mockStoredUser);
    const mockDb = { transaction: jest.fn() };

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);

    await expect(service.createUser(baseDto)).rejects.toThrow(ConflictError);
    expect(adjutorService.isBlacklisted).not.toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});

describe('UserService - createUser negative scenarios', () => {
  let userRepo: jest.Mocked<UserRepository>;
  let walletRepo: ReturnType<typeof buildMockWalletRepo>;
  let adjutorService: jest.Mocked<AdjutorService>;

  beforeEach(() => {
    userRepo = buildMockUserRepo();
    walletRepo = buildMockWalletRepo();
    adjutorService = buildMockAdjutorService();
  });

  it('throws ConflictError when email is already registered', async () => {
    userRepo.findByEmail.mockResolvedValue(mockStoredUser);
    const mockDb = { transaction: jest.fn() };

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);

    await expect(service.createUser(baseDto)).rejects.toThrow(ConflictError);
    await expect(service.createUser(baseDto)).rejects.toThrow(
      'An account with this email address already exists.',
    );
  });

  it('throws ForbiddenError with USER_BLACKLISTED when identity is on karma blacklist', async () => {
    userRepo.findByEmail.mockResolvedValue(undefined);
    adjutorService.isBlacklisted.mockResolvedValue(true);
    const mockDb = { transaction: jest.fn() };

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);

    await expect(service.createUser(baseDto)).rejects.toThrow(ForbiddenError);
    const error = await service.createUser(baseDto).catch((e: ForbiddenError) => e);
    expect((error as ForbiddenError).errorCode).toBe('USER_BLACKLISTED');
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});

describe('UserService - login', () => {
  let userRepo: jest.Mocked<UserRepository>;
  let walletRepo: ReturnType<typeof buildMockWalletRepo>;
  let adjutorService: jest.Mocked<AdjutorService>;

  beforeEach(() => {
    userRepo = buildMockUserRepo();
    walletRepo = buildMockWalletRepo();
    adjutorService = buildMockAdjutorService();
  });

  it('returns public user and token on successful login', async () => {
    userRepo.findByEmail.mockResolvedValue(mockStoredUser);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
    const mockDb = { transaction: jest.fn() };

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);
    const result = await service.login({ email: 'john@example.com', password: 'SecurePass123' });

    expect(result.user.email).toBe('john@example.com');
    expect(result.token).toBeDefined();
    expect((result.user as Record<string, unknown>).password_hash).toBeUndefined();
  });

  it('throws UnauthorizedError when email is not found', async () => {
    userRepo.findByEmail.mockResolvedValue(undefined);
    const mockDb = { transaction: jest.fn() };

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'pass' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password does not match', async () => {
    userRepo.findByEmail.mockResolvedValue(mockStoredUser);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
    const mockDb = { transaction: jest.fn() };

    const service = new UserService(mockDb as never, userRepo, walletRepo, adjutorService);

    await expect(
      service.login({ email: 'john@example.com', password: 'WrongPass' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
