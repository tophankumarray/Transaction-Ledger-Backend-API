const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transferSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
      required: true,
    },
    source_account_id: {
      type: String,
      required: [true, 'Source account ID is required'],
      index: true,
    },
    destination_account_id: {
      type: String,
      required: [true, 'Destination account ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transfer amount is required'],
      min: [0.01, 'Transfer amount must be greater than 0'],
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
      unique: true,
      index: true,
      trim: true,
    },
    source_transaction_id: {
      type: String,
      required: true,
    },
    destination_transaction_id: {
      type: String,
      required: true,
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

transferSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      id: ret.id,
      source_account_id: ret.source_account_id,
      destination_account_id: ret.destination_account_id,
      amount: ret.amount,
      description: ret.description,
      reference_id: ret.reference_id,
      source_transaction_id: ret.source_transaction_id,
      destination_transaction_id: ret.destination_transaction_id,
      created_at: ret.created_at,
    };
  },
});

const Transfer = mongoose.model('Transfer', transferSchema);

module.exports = Transfer;

