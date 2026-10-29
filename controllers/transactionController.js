import transactionService from '../services/transactionService.js';
import { successResponse } from '../utils/responseFormatter.js';

class TransactionController {
  /**
   * POST /api/v1/accounts/:accountId/transactions
   * or POST /api/v1/transactions
   * Adds a transaction (credit or debit) to an account.
   */
  async addTransaction(req, res) {
    const accountId = req.params.accountId || req.body.account_id;
    const { type, amount, description, reference_id } = req.body;

    const result = await transactionService.addTransaction({
      accountId,
      type,
      amount,
      description,
      referenceId: reference_id,
    });

    return res.status(201).json(
      successResponse(
        result.transaction,
        'Transaction processed successfully',
        { current_balance: result.current_balance }
      )
    );
  }

  /**
   * GET /api/v1/accounts/:accountId/transactions
   * Retrieves transaction history for an account.
   */
  async getTransactionHistory(req, res) {
    const { accountId } = req.params;
    const { type, page, limit } = req.query;

    const result = await transactionService.getTransactionHistory({
      accountId,
      type,
      page,
      limit,
    });

    return res.status(200).json(
      successResponse(
        result.transactions,
        'Transaction history retrieved successfully',
        result.pagination
      )
    );
  }
}

export const transactionController = new TransactionController();
export default transactionController;
