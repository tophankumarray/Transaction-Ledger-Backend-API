import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/transaction_ledger',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true',
  DEFAULT_PAGE_LIMIT: parseInt(process.env.DEFAULT_PAGE_LIMIT, 10) || 10,
  MAX_PAGE_LIMIT: parseInt(process.env.MAX_PAGE_LIMIT, 10) || 100,
  JWT_SECRET: process.env.JWT_SECRET || 'ledger_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  API_KEY: process.env.API_KEY || 'ledger-api-key-secret-2026',
};

export default env;
export { env };
