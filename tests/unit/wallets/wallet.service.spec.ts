import { WalletService } from '../../../src/modules/wallets/wallet.service';
import { WalletRepository } from '../../../src/modules/wallets/wallet.repository';
import { TransactionRepository } from '../../../src/modules/transactions/transaction.repository';
import { UserRepository } from '../../../src/modules/users/user.repository';
import { Wallet } from '../../../src/modules/wallets/wallet.types';
import { Transaction } from '../../../src/modules/transactions/transaction.types';
import { User } from '../../../src/modules/users/user.types';
import {
  NotFoundError,
  UnprocessableEntityError,
  BadRequestError,
} from '../../../src/shared/errors/HttpError';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

const mockWallet: Wallet = {
  id: 'wallet-uuid-1',
  user_id: 'user-uuid-1',
  balance: 5000,
  currency: 'NGN',
  is_active: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

const mockTransaction: Transaction = {
  id: 'mock-uuid',
  reference: 'REF-001',
  wallet_id: 'wallet-uuid-1',
  counterpart_wallet_id: null,
  type: 'CREDIT',
  category: 'FUNDING',
  amount: 2000,
  balance_before: 5000,
  balance_after: 7000,
  description: null,
  status: 'SUCCESS',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockUser: User = {
  id: 'user-uuid-2',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '+2348099999999',
  password_hash: 'hash',
  token: null,
  is_blacklisted: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockRecipientWallet: Wallet = {
  ...mockWallet,
  id: 'wallet-uuid-2',
  user_id: 'user-uuid-2',
  balance: 1000,
};

function buildMockWalletRepo(): jest.Mocked<WalletRepository> {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    findByUserId: jest.fn().mockResolvedValue(mockWallet),
    findByUserIdForUpdate: jest.fn().mockResolvedValue(mockWallet),
    findById: jest.fn().mockResolvedValue(mockWallet),
    findByIdForUpdate: jest.fn().mockResolvedValue(mockWallet),
    updateBalance: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<WalletRepository>;
}

function buildMockTxRepo(): jest.Mocked<TransactionRepository> {
  return {
    create: jest.fn().mockResolvedValue(mockTransaction),
    findByWalletId: jest.fn().mockResolvedValue({ transactions: [mockTransaction], total: 1 }),
    findByReference: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TransactionRepository>;
}

function buildMockUserRepo(): jest.Mocked<UserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    findByIdAndToken: jest.fn(),
    create: jest.fn(),
    updateToken: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

function buildMockDb() {
  return {
    transaction: jest.fn().mockImplementation(async (cb: (trx: unknown) => unknown) => cb({})),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// fundWallet
// ─────────────────────────────────────────────────────────────────────────────
describe('WalletService.fundWallet', () => {
  it('credits balance and creates a CREDIT transaction on success', async () => {
    const walletRepo = buildMockWalletRepo();
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);
    const result = await service.fundWallet('user-uuid-1', {
      amount: 2000,
      reference: 'REF-001',
    });

    expect(walletRepo.findByUserIdForUpdate).toHaveBeenCalled();
    expect(walletRepo.updateBalance).toHaveBeenCalledWith('wallet-uuid-1', 7000, expect.anything());
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CREDIT', category: 'FUNDING', amount: 2000 }),
      expect.anything(),
    );
    expect(result.wallet.balance).toBe(7000);
    expect(result.transaction.type).toBe('CREDIT');
  });

  it('throws NotFoundError when wallet does not exist', async () => {
    const walletRepo = buildMockWalletRepo();
    walletRepo.findByUserIdForUpdate.mockResolvedValue(undefined);
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);

    await expect(
      service.fundWallet('user-uuid-1', { amount: 1000, reference: 'REF-002' }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// transfer
// ─────────────────────────────────────────────────────────────────────────────
describe('WalletService.transfer', () => {
  it('debits sender, credits recipient, and creates two transaction records', async () => {
    const walletRepo = buildMockWalletRepo();
    walletRepo.findByUserIdForUpdate
      .mockResolvedValueOnce(mockWallet)          // sender
      .mockResolvedValueOnce(mockRecipientWallet); // recipient
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);
    await service.transfer('user-uuid-1', {
      recipient_email: 'jane@example.com',
      amount: 1000,
      reference: 'TRF-001',
    });

    expect(walletRepo.updateBalance).toHaveBeenCalledTimes(2);
    expect(txRepo.create).toHaveBeenCalledTimes(2);
    // First call should be the DEBIT record for sender
    expect(txRepo.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'DEBIT', category: 'TRANSFER' }),
      expect.anything(),
    );
    // Second call should be the CREDIT record for recipient
    expect(txRepo.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'CREDIT', category: 'TRANSFER' }),
      expect.anything(),
    );
  });

  it('throws UnprocessableEntityError when sender has insufficient balance', async () => {
    const walletRepo = buildMockWalletRepo();
    walletRepo.findByUserIdForUpdate.mockResolvedValue({ ...mockWallet, balance: 100 });
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);

    await expect(
      service.transfer('user-uuid-1', {
        recipient_email: 'jane@example.com',
        amount: 5000,
        reference: 'TRF-002',
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('throws NotFoundError when recipient email does not exist', async () => {
    const walletRepo = buildMockWalletRepo();
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    userRepo.findByEmail.mockResolvedValue(undefined);
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);

    await expect(
      service.transfer('user-uuid-1', {
        recipient_email: 'nobody@example.com',
        amount: 100,
        reference: 'TRF-003',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws BadRequestError on self-transfer attempt', async () => {
    const walletRepo = buildMockWalletRepo();
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    // Recipient has the same id as the sender
    userRepo.findByEmail.mockResolvedValue({ ...mockUser, id: 'user-uuid-1' });
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);

    await expect(
      service.transfer('user-uuid-1', {
        recipient_email: 'myself@example.com',
        amount: 100,
        reference: 'TRF-SELF',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// withdraw
// ─────────────────────────────────────────────────────────────────────────────
describe('WalletService.withdraw', () => {
  it('reduces balance and creates a DEBIT WITHDRAWAL transaction', async () => {
    const walletRepo = buildMockWalletRepo();
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);
    const result = await service.withdraw('user-uuid-1', { amount: 1000, reference: 'WDR-001' });

    expect(walletRepo.updateBalance).toHaveBeenCalledWith('wallet-uuid-1', 4000, expect.anything());
    expect(result.wallet.balance).toBe(4000);
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'DEBIT', category: 'WITHDRAWAL' }),
      expect.anything(),
    );
  });

  it('throws UnprocessableEntityError when withdrawing more than the balance', async () => {
    const walletRepo = buildMockWalletRepo();
    walletRepo.findByUserIdForUpdate.mockResolvedValue({ ...mockWallet, balance: 200 });
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);

    await expect(
      service.withdraw('user-uuid-1', { amount: 1000, reference: 'WDR-002' }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('throws NotFoundError when wallet does not exist', async () => {
    const walletRepo = buildMockWalletRepo();
    walletRepo.findByUserIdForUpdate.mockResolvedValue(undefined);
    const txRepo = buildMockTxRepo();
    const userRepo = buildMockUserRepo();
    const db = buildMockDb();

    const service = new WalletService(db as never, walletRepo, txRepo, userRepo);

    await expect(
      service.withdraw('user-uuid-1', { amount: 500, reference: 'WDR-003' }),
    ).rejects.toThrow(NotFoundError);
  });
});
