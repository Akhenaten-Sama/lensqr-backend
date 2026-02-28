import { Knex } from 'knex';
import { Wallet, CreateWalletRecord } from './wallet.types';

export class WalletRepository {
  constructor(private readonly db: Knex) {}

  async create(record: CreateWalletRecord, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this.db)('wallets').insert(record);
  }

  async findByUserId(userId: string, trx?: Knex.Transaction): Promise<Wallet | undefined> {
    return (trx ?? this.db)<Wallet>('wallets').where({ user_id: userId }).first();
  }

  async findByUserIdForUpdate(userId: string, trx: Knex.Transaction): Promise<Wallet | undefined> {
    return trx<Wallet>('wallets').where({ user_id: userId }).forUpdate().first();
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<Wallet | undefined> {
    return (trx ?? this.db)<Wallet>('wallets').where({ id }).first();
  }

  async findByIdForUpdate(id: string, trx: Knex.Transaction): Promise<Wallet | undefined> {
    return trx<Wallet>('wallets').where({ id }).forUpdate().first();
  }

  async updateBalance(id: string, newBalance: number, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this.db)('wallets')
      .where({ id })
      .update({ balance: newBalance, updated_at: new Date() });
  }
}
