const express = require('express');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');
const transferRoutes = require('./transferRoutes');
const { isTransactionsSupported } = require('../config/database');

const router = express.Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    acid_transactions_enabled: isTransactionsSupported(),
  });
});

// Resource Routers
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/transfers', transferRoutes);

module.exports = router;
