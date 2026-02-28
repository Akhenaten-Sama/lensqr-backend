import { WalletRepository } from '../../../src/modules/wallets/wallet.repository';
import { Wallet, CreateWalletRecord } from '../../../src/modules/wallets/wallet.types';

const mockWallet: Wallet = {
  id: 'wallet-uuid-1',
  user_id: 'user-uuid-1',
  balance: 5000,
  currency: 'NGN',
  is_active: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

function buildMockQueryBuilder(returnValue: unknown) {
  return {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(returnValue),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    forUpdate: jest.fn().mockReturnThis(),
  };
}

function buildMockDb(returnValue: unknown) {
  const qb = buildMockQueryBuilder(returnValue);
  const db = jest.fn().mockReturnValue(qb);
  return { db, qb };
}

describe('WalletRepository', () => {
  describe('findByUserId', () => {
    it('returns the wallet when user_id is found', async () => {
      const { db } = buildMockDb(mockWallet);
      const repo = new WalletRepository(db as never);

      const result = await repo.findByUserId('user-uuid-1');

      expect(result).toEqual(mockWallet);
    });

    it('returns undefined when user has no wallet', async () => {
      const { db } = buildMockDb(undefined);
      const repo = new WalletRepository(db as never);

      const result = await repo.findByUserId('nonexistent-user');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('inserts a wallet record without throwing', async () => {
      const { db, qb } = buildMockDb(undefined);
      const repo = new WalletRepository(db as never);

      const record: CreateWalletRecord = { id: 'wallet-uuid-2', user_id: 'user-uuid-2' };
      await expect(repo.create(record)).resolves.toBeUndefined();
      expect(qb.insert).toHaveBeenCalledWith(record);
    });
  });

  describe('updateBalance', () => {
    it('calls update with the new balance value', async () => {
      const { db, qb } = buildMockDb(undefined);
      const repo = new WalletRepository(db as never);

      await repo.updateBalance('wallet-uuid-1', 10000);

      expect(qb.where).toHaveBeenCalledWith({ id: 'wallet-uuid-1' });
      expect(qb.update).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 10000 }),
      );
    });
  });
});
