import { v4 as uuidv4 } from 'uuid';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Transfer from '../models/Transfer.js';
import { runInTransaction } from '../config/database.js';
import {
  NotFoundError,
  ConflictError,
  InsufficientBalanceError,
  BadRequestError,
} from '../errors/index.js';
import { TRANSACTION_TYPES, ERROR_CODES } from '../constants/transactionTypes.js';
import { roundToTwoDecimals, addMoney, subtractMoney } from '../utils/math.js';

class TransferService {
  /**
   * Transfers money atomically from source account to destination account.
   *
   * @param {object} param0
   * @param {string} param0.sourceAccountId
   * @param {string} param0.destinationAccountId
   * @param {number} param0.amount
   * @param {string} [param0.description]
   * @param {string} param0.referenceId
   * @returns {Promise<object>}
   */
  async transferMoney({
    sourceAccountId,
    destinationAccountId,
    amount,
    description = '',
    referenceId,
  }) {
    if (!sourceAccountId || !destinationAccountId) {
      throw new BadRequestError(
        'Both source_account_id and destination_account_id are required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (sourceAccountId === destinationAccountId) {
      throw new BadRequestError(
        'Cannot transfer money to the same account',
        ERROR_CODES.SAME_ACCOUNT_TRANSFER
      );
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new BadRequestError('Transfer amount must be greater than 0', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!referenceId) {
      throw new BadRequestError('reference_id is required for transfer', ERROR_CODES.VALIDATION_ERROR);
    }

    const normalizedAmount = roundToTwoDecimals(amount);

    return await runInTransaction(async (session) => {
      // 1. Check for duplicate transfer reference ID
      const transferQuery = Transfer.findOne({ reference_id: referenceId });
      if (session) transferQuery.session(session);
      const existingTransfer = await transferQuery;

      if (existingTransfer) {
        throw new ConflictError(
          `A transfer with reference_id '${referenceId}' already exists. No funds transferred.`,
          ERROR_CODES.DUPLICATE_REFERENCE,
          { reference_id: referenceId, transfer_id: existingTransfer.id }
        );
      }

      // 2. Fetch both accounts
      const srcAccountQuery = Account.findOne({ id: sourceAccountId });
      const destAccountQuery = Account.findOne({ id: destinationAccountId });
      if (session) {
        srcAccountQuery.session(session);
        destAccountQuery.session(session);
      }

      const [sourceAccount, destinationAccount] = await Promise.all([
        srcAccountQuery,
        destAccountQuery,
      ]);

      if (!sourceAccount) {
        throw new NotFoundError(
          `Source account '${sourceAccountId}' was not found`,
          ERROR_CODES.ACCOUNT_NOT_FOUND
        );
      }

      if (!destinationAccount) {
        throw new NotFoundError(
          `Destination account '${destinationAccountId}' was not found`,
          ERROR_CODES.ACCOUNT_NOT_FOUND
        );
      }

      // 3. Verify source account has sufficient balance
      if (sourceAccount.balance < normalizedAmount) {
        throw new InsufficientBalanceError(
          `Insufficient balance in source account. Available: ${sourceAccount.balance.toFixed(2)}, required: ${normalizedAmount.toFixed(2)}`,
          {
            source_account_id: sourceAccountId,
            available_balance: sourceAccount.balance,
            transfer_amount: normalizedAmount,
          }
        );
      }

      // 4. Calculate new balances
      const newSourceBalance = subtractMoney(sourceAccount.balance, normalizedAmount);
      const newDestBalance = addMoney(destinationAccount.balance, normalizedAmount);

      // 5. Update balances atomically
      const srcUpdate = await Account.findOneAndUpdate(
        { id: sourceAccountId, balance: { $gte: normalizedAmount } },
        { $set: { balance: newSourceBalance } },
        { new: true, session: session || undefined }
      );

      if (!srcUpdate) {
        throw new InsufficientBalanceError(
          'Source account balance changed concurrently or is insufficient. Transfer aborted.',
          { source_account_id: sourceAccountId }
        );
      }

      await Account.findOneAndUpdate(
        { id: destinationAccountId },
        { $set: { balance: newDestBalance } },
        { new: true, session: session || undefined }
      );

      // 6. Create ledger transaction for source (Debit)
      const sourceTxId = uuidv4();
      const destTxId = uuidv4();

      const sourceTxData = {
        id: sourceTxId,
        account_id: sourceAccountId,
        type: TRANSACTION_TYPES.DEBIT,
        amount: normalizedAmount,
        description: description
          ? `Transfer to ${destinationAccountId}: ${description}`
          : `Transfer to account ${destinationAccountId}`,
        reference_id: `transfer-out-${referenceId}`,
        created_at: new Date(),
      };

      // 7. Create ledger transaction for destination (Credit)
      const destTxData = {
        id: destTxId,
        account_id: destinationAccountId,
        type: TRANSACTION_TYPES.CREDIT,
        amount: normalizedAmount,
        description: description
          ? `Transfer from ${sourceAccountId}: ${description}`
          : `Transfer from account ${sourceAccountId}`,
        reference_id: `transfer-in-${referenceId}`,
        created_at: new Date(),
      };

      if (session) {
        await Transaction.create([sourceTxData, destTxData], { session });
      } else {
        await Transaction.create(sourceTxData);
        await Transaction.create(destTxData);
      }

      // 8. Create Transfer record
      const transferData = {
        id: uuidv4(),
        source_account_id: sourceAccountId,
        destination_account_id: destinationAccountId,
        amount: normalizedAmount,
        description: description ? description.trim() : '',
        reference_id: referenceId.trim(),
        source_transaction_id: sourceTxId,
        destination_transaction_id: destTxId,
        created_at: new Date(),
      };

      let createdTransfer;
      if (session) {
        const result = await Transfer.create([transferData], { session });
        createdTransfer = result[0];
      } else {
        createdTransfer = await Transfer.create(transferData);
      }

      return {
        transfer: createdTransfer.toJSON(),
        source_account: {
          id: sourceAccountId,
          previous_balance: sourceAccount.balance,
          new_balance: newSourceBalance,
        },
        destination_account: {
          id: destinationAccountId,
          previous_balance: destinationAccount.balance,
          new_balance: newDestBalance,
        },
      };
    });
  }
}

export const transferService = new TransferService();
export default transferService;
