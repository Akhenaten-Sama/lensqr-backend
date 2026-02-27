import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.string('id', 36).primary().notNullable();
    table.string('reference', 100).notNullable().unique();
    table
      .string('wallet_id', 36)
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .string('counterpart_wallet_id', 36)
      .nullable()
      .references('id')
      .inTable('wallets')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.enu('type', ['CREDIT', 'DEBIT']).notNullable();
    table.enu('category', ['FUNDING', 'TRANSFER', 'WITHDRAWAL']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('balance_before', 15, 2).notNullable();
    table.decimal('balance_after', 15, 2).notNullable();
    table.string('description', 500).nullable();
    table.enu('status', ['PENDING', 'SUCCESS', 'FAILED']).notNullable().defaultTo('PENDING');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

    // Indexes for common query patterns
    table.index(['wallet_id'], 'IDX_transactions_wallet_id');
    table.index(['counterpart_wallet_id'], 'IDX_transactions_counterpart_wallet_id');
    table.index(['created_at'], 'IDX_transactions_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
