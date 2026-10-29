import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TRANSACTION_TYPES } from '../constants/transactionTypes.js';

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
transactionSchema.index({ account_id: 1, reference_id: 1 }, { unique: true });
transactionSchema.index({ account_id: 1, created_at: -1 });
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

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
