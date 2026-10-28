const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const accountSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      minlength: [1, 'Name must not be empty'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Account balance cannot be negative'],
      // Stored as floating point rounded to 2 decimals
      set: (val) => Math.round((val + Number.EPSILON) * 100) / 100,
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
    timestamps: false, // We explicitly manage created_at as specified in assignment
  }
);

// Format output to match assignment requirements exactly
accountSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      id: ret.id,
      name: ret.name,
      balance: ret.balance,
      created_at: ret.created_at,
    };
  },
});

accountSchema.set('toObject', {
  transform: (doc, ret) => {
    return {
      id: ret.id,
      name: ret.name,
      balance: ret.balance,
      created_at: ret.created_at,
    };
  },
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
