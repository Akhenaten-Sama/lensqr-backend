import { Knex } from 'knex';
import { Transaction, CreateTransactionRecord } from './transaction.types';

export class TransactionRepository {
  constructor(private readonly db: Knex) {}

  async create(record: CreateTransactionRecord, trx?: Knex.Transaction): Promise<Transaction> {
    await (trx ?? this.db)('transactions').insert(record);
    const created = await (trx ?? this.db)<Transaction>('transactions')
      .where({ id: record.id })
      .first();
    return created!;
  }

  async findByWalletId(
    walletId: string,
    page: number,
    limit: number,
    trx?: Knex.Transaction,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const offset = (page - 1) * limit;

    const [transactions, countResult] = await Promise.all([
      (trx ?? this.db)<Transaction>('transactions')
        .where({ wallet_id: walletId })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      (trx ?? this.db)('transactions').where({ wallet_id: walletId }).count('id as count').first(),
    ]);

    const total = Number((countResult as { count: string })?.count ?? 0);
    return { transactions, total };
  }

  async findByReference(reference: string, trx?: Knex.Transaction): Promise<Transaction | undefined> {
    return (trx ?? this.db)<Transaction>('transactions').where({ reference }).first();
  }
}
