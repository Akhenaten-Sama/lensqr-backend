import { UserRepository } from '../../../src/modules/users/user.repository';
import { User, CreateUserRecord } from '../../../src/modules/users/user.types';

const mockUser: User = {
  id: 'user-uuid-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone_number: '+2348012345678',
  password_hash: '$2b$10$hashedpassword',
  token: 'token.abc123',
  is_blacklisted: false,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

function buildMockQueryBuilder(returnValue: unknown) {
  const qb = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(returnValue),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
  };
  return qb;
}

function buildMockDb(returnValue: unknown) {
  const qb = buildMockQueryBuilder(returnValue);
  const db = jest.fn().mockReturnValue(qb) as unknown as jest.Mock & {
    _qb: typeof qb;
  };
  (db as unknown as { _qb: typeof qb })._qb = qb;
  return { db, qb };
}

describe('UserRepository', () => {
  describe('findById', () => {
    it('returns a user when found', async () => {
      const { db, qb } = buildMockDb(mockUser);
      const repo = new UserRepository(db as never);

      const result = await repo.findById('user-uuid-1');

      expect(db).toHaveBeenCalledWith('users');
      expect(qb.where).toHaveBeenCalledWith({ id: 'user-uuid-1' });
      expect(result).toEqual(mockUser);
    });

    it('returns undefined when user not found', async () => {
      const { db } = buildMockDb(undefined);
      const repo = new UserRepository(db as never);

      const result = await repo.findById('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('returns a user when found by email', async () => {
      const { db } = buildMockDb(mockUser);
      const repo = new UserRepository(db as never);

      const result = await repo.findByEmail('john.doe@example.com');

      expect(result).toEqual(mockUser);
    });

    it('returns undefined when email not found', async () => {
      const { db } = buildMockDb(undefined);
      const repo = new UserRepository(db as never);

      const result = await repo.findByEmail('nobody@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('findByIdAndToken', () => {
    it('returns a user when id and token both match', async () => {
      const { db, qb } = buildMockDb(mockUser);
      const repo = new UserRepository(db as never);

      const result = await repo.findByIdAndToken('user-uuid-1', 'token.abc123');

      expect(qb.where).toHaveBeenCalledWith({ id: 'user-uuid-1', token: 'token.abc123' });
      expect(result).toEqual(mockUser);
    });

    it('returns undefined when token does not match', async () => {
      const { db } = buildMockDb(undefined);
      const repo = new UserRepository(db as never);

      const result = await repo.findByIdAndToken('user-uuid-1', 'wrong.token');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('inserts the user record without throwing', async () => {
      const { db, qb } = buildMockDb(undefined);
      const repo = new UserRepository(db as never);

      const record: CreateUserRecord = {
        id: 'user-uuid-2',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
        phone_number: '+2348087654321',
        password_hash: '$2b$10$anotherhash',
        token: 'token.xyz789',
        is_blacklisted: false,
      };

      await expect(repo.create(record)).resolves.toBeUndefined();
      expect(qb.insert).toHaveBeenCalledWith(record);
    });
  });
});
