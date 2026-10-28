const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/transaction_ledger',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true',
  DEFAULT_PAGE_LIMIT: parseInt(process.env.DEFAULT_PAGE_LIMIT, 10) || 10,
  MAX_PAGE_LIMIT: parseInt(process.env.MAX_PAGE_LIMIT, 10) || 100,
};

module.exports = env;
