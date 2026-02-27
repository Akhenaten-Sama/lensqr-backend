import knex, { Knex } from 'knex';
import { env } from './environment';
import knexConfig from '../database/knexfile';

const environment = env.NODE_ENV as keyof typeof knexConfig;
const config = knexConfig[environment] ?? knexConfig['development'];

const db: Knex = knex(config);

export default db;
