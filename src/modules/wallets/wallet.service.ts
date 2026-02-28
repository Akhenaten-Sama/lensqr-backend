import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { WalletRepository } from './wallet.repository';
import { TransactionRepository } from '../transactions/transaction.repository';
import { UserRepository } from '../users/user.repository';
import { FundWalletDto, TransferDto, Wallet, WithdrawDto } from './wallet.types';
import { Transaction } from '../transactions/transaction.types';
import {
  NotFoundError,
  UnprocessableEntityError,
  BadRequestError,
} from '../../shared/errors/HttpError';

export interface FundWalletResult {
  transaction: Transaction;
  wallet: Wallet;
}

export interface TransferResult {
  transaction: Transaction;
  wallet: Wallet;
}

export interface WithdrawResult {
  transaction: Transaction;
  wallet: Wallet;
}

export class WalletService {
  constructor(
    private readonly db: Knex,
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: TransactionRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async fundWallet(userId: string, dto: FundWalletDto): Promise<FundWalletResult> {
    return this.db.transaction(async (trx) => {
      const wallet = await this.walletRepo.findByUserIdForUpdate(userId, trx);
      if (!wallet) throw new NotFoundError('Wallet not found.');

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + dto.amount;

      await this.walletRepo.updateBalance(wallet.id, balanceAfter, trx);

      const transaction = await this.txRepo.create(
        {
          id: uuidv4(),
          reference: dto.reference,
          wallet_id: wallet.id,
          counterpart_wallet_id: null,
          type: 'CREDIT',
          category: 'FUNDING',
          amount: dto.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: dto.description ?? null,
          status: 'SUCCESS',
        },
        trx,
      );

      return { transaction, wallet: { ...wallet, balance: balanceAfter } };
    });
  }

  async transfer(userId: string, dto: TransferDto): Promise<TransferResult> {
    return this.db.transaction(async (trx) => {
      // Lock sender wallet
      const senderWallet = await this.walletRepo.findByUserIdForUpdate(userId, trx);
      if (!senderWallet) throw new NotFoundError('Sender wallet not found.');

      // Find recipient
      const recipientUser = await this.userRepo.findByEmail(dto.recipient_email, trx);
      if (!recipientUser) throw new NotFoundError('Recipient not found.');

      // Prevent self-transfer
      if (recipientUser.id === userId) {
        throw new BadRequestError('You cannot transfer funds to your own wallet.');
      }

      // Lock recipient wallet
      const recipientWallet = await this.walletRepo.findByUserIdForUpdate(recipientUser.id, trx);
      if (!recipientWallet) throw new NotFoundError('Recipient wallet not found.');

      const senderBalanceBefore = Number(senderWallet.balance);
      if (senderBalanceBefore < dto.amount) {
        throw new UnprocessableEntityError('Insufficient wallet balance.');
      }

      const senderBalanceAfter = senderBalanceBefore - dto.amount;
      const recipientBalanceBefore = Number(recipientWallet.balance);
      const recipientBalanceAfter = recipientBalanceBefore + dto.amount;

      // Update both balances
      await this.walletRepo.updateBalance(senderWallet.id, senderBalanceAfter, trx);
      await this.walletRepo.updateBalance(recipientWallet.id, recipientBalanceAfter, trx);

      // Create DEBIT record for sender
      const debitTx = await this.txRepo.create(
        {
          id: uuidv4(),
          reference: dto.reference,
          wallet_id: senderWallet.id,
          counterpart_wallet_id: recipientWallet.id,
          type: 'DEBIT',
          category: 'TRANSFER',
          amount: dto.amount,
          balance_before: senderBalanceBefore,
          balance_after: senderBalanceAfter,
          description: dto.description ?? null,
          status: 'SUCCESS',
        },
        trx,
      );

      // Create CREDIT record for recipient
      await this.txRepo.create(
        {
          id: uuidv4(),
          reference: `${dto.reference}-CREDIT`,
          wallet_id: recipientWallet.id,
          counterpart_wallet_id: senderWallet.id,
          type: 'CREDIT',
          category: 'TRANSFER',
          amount: dto.amount,
          balance_before: recipientBalanceBefore,
          balance_after: recipientBalanceAfter,
          description: dto.description ?? null,
          status: 'SUCCESS',
        },
        trx,
      );

      return {
        transaction: debitTx,
        wallet: { ...senderWallet, balance: senderBalanceAfter },
      };
    });
  }

  async withdraw(userId: string, dto: WithdrawDto): Promise<WithdrawResult> {
    return this.db.transaction(async (trx) => {
      const wallet = await this.walletRepo.findByUserIdForUpdate(userId, trx);
      if (!wallet) throw new NotFoundError('Wallet not found.');

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < dto.amount) {
        throw new UnprocessableEntityError('Insufficient wallet balance.');
      }

      const balanceAfter = balanceBefore - dto.amount;

      await this.walletRepo.updateBalance(wallet.id, balanceAfter, trx);

      const transaction = await this.txRepo.create(
        {
          id: uuidv4(),
          reference: dto.reference,
          wallet_id: wallet.id,
          counterpart_wallet_id: null,
          type: 'DEBIT',
          category: 'WITHDRAWAL',
          amount: dto.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: dto.description ?? null,
          status: 'SUCCESS',
        },
        trx,
      );

      return { transaction, wallet: { ...wallet, balance: balanceAfter } };
    });
  }

  async getBalance(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) throw new NotFoundError('Wallet not found.');
    return wallet;
  }

  async getTransactionHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ transactions: Transaction[]; total: number; page: number; limit: number }> {
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) throw new NotFoundError('Wallet not found.');

    const { transactions, total } = await this.txRepo.findByWalletId(wallet.id, page, limit);
    return { transactions, total, page, limit };
  }
}
