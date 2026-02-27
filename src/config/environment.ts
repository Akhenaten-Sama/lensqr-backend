import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  TEST_DB_NAME: string;
  ADJUTOR_BASE_URL: string;
  ADJUTOR_API_KEY: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function loadEnvironment(): EnvironmentConfig {
  const nodeEnv = optionalEnv('NODE_ENV', 'development');

  // In test environment, relax required checks for DB and Adjutor
  // since unit tests use mocks and don't need real credentials
  if (nodeEnv === 'test') {
    return {
      NODE_ENV: nodeEnv,
      PORT: parseInt(optionalEnv('PORT', '3000'), 10),
      DB_HOST: optionalEnv('DB_HOST', '127.0.0.1'),
      DB_PORT: parseInt(optionalEnv('DB_PORT', '3306'), 10),
      DB_NAME: optionalEnv('DB_NAME', 'demo_credit'),
      DB_USER: optionalEnv('DB_USER', 'root'),
      DB_PASSWORD: optionalEnv('DB_PASSWORD', ''),
      TEST_DB_NAME: optionalEnv('TEST_DB_NAME', 'demo_credit_test'),
      ADJUTOR_BASE_URL: optionalEnv('ADJUTOR_BASE_URL', 'https://adjutor.lendsqr.com'),
      ADJUTOR_API_KEY: optionalEnv('ADJUTOR_API_KEY', 'test-api-key'),
    };
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: parseInt(optionalEnv('PORT', '3000'), 10),
    DB_HOST: requireEnv('DB_HOST'),
    DB_PORT: parseInt(optionalEnv('DB_PORT', '3306'), 10),
    DB_NAME: requireEnv('DB_NAME'),
    DB_USER: requireEnv('DB_USER'),
    DB_PASSWORD: requireEnv('DB_PASSWORD'),
    TEST_DB_NAME: optionalEnv('TEST_DB_NAME', 'demo_credit_test'),
    ADJUTOR_BASE_URL: requireEnv('ADJUTOR_BASE_URL'),
    ADJUTOR_API_KEY: requireEnv('ADJUTOR_API_KEY'),
  };
}

export const env = loadEnvironment();
