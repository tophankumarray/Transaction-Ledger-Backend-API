import express from 'express';
import authRoutes from './authRoutes.js';
import accountRoutes from './accountRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import transferRoutes from './transferRoutes.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 1. Public Authentication Endpoints (/register, /login)
router.use('/auth', authRoutes);

// 2. Protected Ledger Endpoints (Protected by authenticate middleware)
router.use('/accounts', authenticate, accountRoutes);
router.use('/transactions', authenticate, transactionRoutes);
router.use('/transfers', authenticate, transferRoutes);

export default router;
