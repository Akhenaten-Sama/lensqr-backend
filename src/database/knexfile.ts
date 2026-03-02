import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const knexConfig: Record<string, Knex.Config> = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env['DB_HOST'] ?? '127.0.0.1',
      port: parseInt(process.env['DB_PORT'] ?? '3306', 10),
      database: process.env['DB_NAME'] ?? 'demo_credit',
      user: process.env['DB_USER'] ?? 'root',
      password: process.env['DB_PASSWORD'] ?? '',
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env['DB_HOST'] ?? '127.0.0.1',
      port: parseInt(process.env['DB_PORT'] ?? '3306', 10),
      database: process.env['TEST_DB_NAME'] ?? 'demo_credit_test',
      user: process.env['DB_USER'] ?? 'root',
      password: process.env['DB_PASSWORD'] ?? '',
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      extension: 'ts',
    },
    pool: {
      min: 1,
      max: 5,
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env['DB_HOST'],
      port: parseInt(process.env['DB_PORT'] ?? '3306', 10),
      database: process.env['DB_NAME'],
      user: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      ssl: { rejectUnauthorized: true },
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};

export default knexConfig;
