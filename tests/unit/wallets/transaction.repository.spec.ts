import { TransactionRepository } from '../../../src/modules/transactions/transaction.repository';
import { CreateTransactionRecord, Transaction } from '../../../src/modules/transactions/transaction.types';

const mockTransaction: Transaction = {
  id: 'tx-uuid-1',
  reference: 'REF-001',
  wallet_id: 'wallet-uuid-1',
  counterpart_wallet_id: null,
  type: 'CREDIT',
  category: 'FUNDING',
  amount: 5000,
  balance_before: 0,
  balance_after: 5000,
  description: null,
  status: 'SUCCESS',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

function buildMockDb(returnValue: unknown) {
  const qb = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(returnValue),
    insert: jest.fn().mockResolvedValue([1]),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue([mockTransaction]),
    count: jest.fn().mockReturnThis(),
  };
  const db = jest.fn().mockReturnValue(qb);
  return { db, qb };
}

describe('TransactionRepository', () => {
  describe('create', () => {
    it('inserts a transaction record and returns it', async () => {
      const qb = {
        insert: jest.fn().mockResolvedValue([1]),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockTransaction),
      };
      const db = jest.fn().mockReturnValue(qb);
      const repo = new TransactionRepository(db as never);

      const record: CreateTransactionRecord = {
        id: 'tx-uuid-1',
        reference: 'REF-001',
        wallet_id: 'wallet-uuid-1',
        counterpart_wallet_id: null,
        type: 'CREDIT',
        category: 'FUNDING',
        amount: 5000,
        balance_before: 0,
        balance_after: 5000,
        status: 'SUCCESS',
      };

      const result = await repo.create(record);

      expect(qb.insert).toHaveBeenCalledWith(record);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findByReference', () => {
    it('returns the transaction when reference is found', async () => {
      const { db } = buildMockDb(mockTransaction);
      const repo = new TransactionRepository(db as never);

      const result = await repo.findByReference('REF-001');

      expect(result).toEqual(mockTransaction);
    });

    it('returns undefined when reference is not found', async () => {
      const { db } = buildMockDb(undefined);
      const repo = new TransactionRepository(db as never);

      const result = await repo.findByReference('NONEXISTENT');

      expect(result).toBeUndefined();
    });
  });
});
