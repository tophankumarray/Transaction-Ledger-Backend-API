const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { TRANSACTION_TYPES } = require('../constants/transactionTypes');

const transactionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
      required: true,
    },
    account_id: {
      type: String,
      required: [true, 'Account ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: [TRANSACTION_TYPES.CREDIT, TRANSACTION_TYPES.DEBIT],
        message: 'Transaction type must be either credit or debit',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Transaction amount must be greater than 0'],
      set: (val) => Math.round((val + Number.EPSILON) * 100) / 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [255, 'Description cannot exceed 255 characters'],
    },
    reference_id: {
      type: String,
      required: [true, 'Reference ID is required'],
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

// Database constraints:
// 1. Unique reference_id per account (idempotency key within an account)
transactionSchema.index({ account_id: 1, reference_id: 1 }, { unique: true });

// 2. Query optimization for fetching transaction history latest-first
transactionSchema.index({ account_id: 1, created_at: -1 });

// 3. Query optimization for filtered transactions by type
transactionSchema.index({ account_id: 1, type: 1, created_at: -1 });

// Immutability enforcement: Block updates and deletions
const preventModification = function () {
  throw new Error('Ledger integrity violation: Transactions are immutable and cannot be updated or deleted.');
};

transactionSchema.pre('updateOne', preventModification);
transactionSchema.pre('updateMany', preventModification);
transactionSchema.pre('findOneAndUpdate', preventModification);
transactionSchema.pre('deleteOne', preventModification);
transactionSchema.pre('deleteMany', preventModification);
transactionSchema.pre('findOneAndDelete', preventModification);

// Output formatting
transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      id: ret.id,
      account_id: ret.account_id,
      type: ret.type,
      amount: ret.amount,
      description: ret.description,
      reference_id: ret.reference_id,
      created_at: ret.created_at,
    };
  },
});

transactionSchema.set('toObject', {
  transform: (doc, ret) => {
    return {
      id: ret.id,
      account_id: ret.account_id,
      type: ret.type,
      amount: ret.amount,
      description: ret.description,
      reference_id: ret.reference_id,
      created_at: ret.created_at,
    };
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

