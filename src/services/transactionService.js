const { v4: uuidv4 } = require('uuid');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { runInTransaction } = require('../config/database');
const {
  NotFoundError,
  ConflictError,
  InsufficientBalanceError,
  BadRequestError,
} = require('../errors');
const { TRANSACTION_TYPES, ERROR_CODES } = require('../constants/transactionTypes');
const { roundToTwoDecimals, addMoney, subtractMoney } = require('../utils/math');

class TransactionService {
  /**
   * Adds a transaction (credit or debit) to an account atomically.
   *
   * @param {object} param0
   * @param {string} param0.accountId - ID of the account
   * @param {'credit' | 'debit'} param0.type - Transaction type
   * @param {number} param0.amount - Positive amount
   * @param {string} [param0.description] - Description
   * @param {string} param0.referenceId - Unique reference ID per account
   * @returns {Promise<object>} Created transaction details and current balance
   */
  async addTransaction({ accountId, type, amount, description = '', referenceId }) {
    if (!accountId) {
      throw new BadRequestError('Account ID is required', ERROR_CODES.VALIDATION_ERROR);
    }
    if (!referenceId) {
      throw new BadRequestError('reference_id is required', ERROR_CODES.VALIDATION_ERROR);
    }
    if (type !== TRANSACTION_TYPES.CREDIT && type !== TRANSACTION_TYPES.DEBIT) {
      throw new BadRequestError(
        `Invalid transaction type. Must be '${TRANSACTION_TYPES.CREDIT}' or '${TRANSACTION_TYPES.DEBIT}'`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new BadRequestError('Transaction amount must be greater than 0', ERROR_CODES.VALIDATION_ERROR);
    }

    const normalizedAmount = roundToTwoDecimals(amount);

    return await runInTransaction(async (session) => {
      // 1. Verify account exists
      const accountQuery = Account.findOne({ id: accountId });
      if (session) accountQuery.session(session);
      const account = await accountQuery;

      if (!account) {
        throw new NotFoundError(
          `Account with ID '${accountId}' was not found`,
          ERROR_CODES.ACCOUNT_NOT_FOUND
        );
      }

      // 2. Check for duplicate reference_id within this account
      const duplicateQuery = Transaction.findOne({
        account_id: accountId,
        reference_id: referenceId,
      });
      if (session) duplicateQuery.session(session);
      const existingTx = await duplicateQuery;

      if (existingTx) {
        throw new ConflictError(
          `A transaction with reference_id '${referenceId}' already exists for account '${accountId}'. Account balance unchanged.`,
          ERROR_CODES.DUPLICATE_REFERENCE,
          {
            account_id: accountId,
            reference_id: referenceId,
            existing_transaction_id: existingTx.id,
          }
        );
      }

      // 3. Balance verification and calculation
      let newBalance;
      if (type === TRANSACTION_TYPES.DEBIT) {
        if (account.balance < normalizedAmount) {
          throw new InsufficientBalanceError(
            `Insufficient balance for debit. Current balance is ${account.balance.toFixed(2)}, requested debit is ${normalizedAmount.toFixed(2)}`,
            {
              current_balance: account.balance,
              requested_amount: normalizedAmount,
            }
          );
        }
        newBalance = subtractMoney(account.balance, normalizedAmount);
      } else {
        newBalance = addMoney(account.balance, normalizedAmount);
      }

      // 4. Update account balance conditionally
      if (type === TRANSACTION_TYPES.DEBIT) {
        const updateResult = await Account.findOneAndUpdate(
          { id: accountId, balance: { $gte: normalizedAmount } },
          { $set: { balance: newBalance } },
          { new: true, session: session || undefined }
        );

        if (!updateResult) {
          throw new InsufficientBalanceError(
            `Insufficient balance for debit. Transaction aborted.`,
            {
              current_balance: account.balance,
              requested_amount: normalizedAmount,
            }
          );
        }
      } else {
        await Account.findOneAndUpdate(
          { id: accountId },
          { $set: { balance: newBalance } },
          { new: true, session: session || undefined }
        );
      }

      // 5. Create immutable Transaction record
      const transactionData = {
        id: uuidv4(),
        account_id: accountId,
        type,
        amount: normalizedAmount,
        description: description ? description.trim() : '',
        reference_id: referenceId.trim(),
        created_at: new Date(),
      };

      try {
        let createdTransaction;
        if (session) {
          const created = await Transaction.create([transactionData], { session });
          createdTransaction = created[0];
        } else {
          createdTransaction = await Transaction.create(transactionData);
        }

        return {
          transaction: createdTransaction.toJSON(),
          current_balance: newBalance,
        };
      } catch (insertError) {
        // In standalone mode without transactions, if insert fails due to duplicate key, rollback balance
        if (!session) {
          const rollbackDelta = type === TRANSACTION_TYPES.CREDIT ? -normalizedAmount : normalizedAmount;
          await Account.updateOne({ id: accountId }, { $inc: { balance: rollbackDelta } });
        }
        if (insertError.code === 11000) {
          throw new ConflictError(
            `A transaction with reference_id '${referenceId}' already exists for account '${accountId}'.`,
            ERROR_CODES.DUPLICATE_REFERENCE
          );
        }
        throw insertError;
      }
    });
  }

  /**
   * Retrieves transaction history for an account with filtering, pagination, and latest-first sorting.
   *
   * @param {object} param0
   * @param {string} param0.accountId
   * @param {string} [param0.type] - Optional filter ('credit' or 'debit')
   * @param {number} [param0.page=1]
   * @param {number} [param0.limit=10]
   * @returns {Promise<{ transactions: Array, pagination: object }>}
   */
  async getTransactionHistory({ accountId, type, page = 1, limit = 10 }) {
    // 1. Verify account exists
    const account = await Account.findOne({ id: accountId });
    if (!account) {
      throw new NotFoundError(
        `Account with ID '${accountId}' was not found`,
        ERROR_CODES.ACCOUNT_NOT_FOUND
      );
    }

    // 2. Build query filter
    const query = { account_id: accountId };
    if (type) {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // 3. Execute count and find queries
    const [totalRecords, transactions] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .sort({ created_at: -1, _id: -1 }) // Latest first
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalRecords / limitNum);

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      account_id: tx.account_id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      reference_id: tx.reference_id,
      created_at: tx.created_at,
    }));

    return {
      transactions: formattedTransactions,
      pagination: {
        current_page: pageNum,
        page_size: limitNum,
        total_records: totalRecords,
        total_pages: totalPages,
      },
    };
  }
}

module.exports = new TransactionService();
