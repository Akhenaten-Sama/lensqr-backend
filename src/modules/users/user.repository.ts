import { Knex } from 'knex';
import { User, CreateUserRecord } from './user.types';

export class UserRepository {
  constructor(private readonly db: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<User | undefined> {
    return (trx ?? this.db)<User>('users').where({ id }).first();
  }

  async findByEmail(email: string, trx?: Knex.Transaction): Promise<User | undefined> {
    return (trx ?? this.db)<User>('users').where({ email }).first();
  }

  async findByIdAndToken(
    id: string,
    token: string,
    trx?: Knex.Transaction,
  ): Promise<User | undefined> {
    return (trx ?? this.db)<User>('users').where({ id, token }).first();
  }

  async create(record: CreateUserRecord, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this.db)('users').insert(record);
  }

  async updateToken(id: string, token: string | null, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this.db)('users').where({ id }).update({ token, updated_at: new Date() });
  }
}
