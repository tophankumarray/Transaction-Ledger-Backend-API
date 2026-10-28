const express = require('express');
const authRoutes = require('./authRoutes');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');
const transferRoutes = require('./transferRoutes');
const { authenticate } = require('../middlewares/authMiddleware');
const { isTransactionsSupported } = require('../config/database');

const router = express.Router();

// 1. Public Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    acid_transactions_enabled: isTransactionsSupported(),
  });
});

// 2. Public Authentication Endpoints (/register, /login)
router.use('/auth', authRoutes);

// 3. Protected Ledger Endpoints (Protected by authenticate middleware)
router.use('/accounts', authenticate, accountRoutes);
router.use('/transactions', authenticate, transactionRoutes);
router.use('/transfers', authenticate, transferRoutes);

module.exports = router;
