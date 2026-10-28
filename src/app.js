const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const env = require('./config/env');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// HTTP Request Logging (disable in test environment)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Body Parsing Middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Transaction Ledger Backend API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      accounts: '/api/v1/accounts',
      transactions: '/api/v1/transactions',
      transfers: '/api/v1/transfers',
      health: '/api/v1/health',
    },
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
