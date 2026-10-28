const accountService = require('../services/accountService');
const { successResponse } = require('../utils/responseFormatter');

class AccountController {
  /**
   * POST /api/v1/accounts
   * Creates a new account with 0 balance.
   */
  async createAccount(req, res) {
    const { name } = req.body;
    const account = await accountService.createAccount({ name });

    return res.status(201).json(
      successResponse(account, 'Account created successfully')
    );
  }

  /**
   * GET /api/v1/accounts/:accountId
   * Retrieves account details.
   */
  async getAccountById(req, res) {
    const { accountId } = req.params;
    const account = await accountService.getAccountById(accountId);

    return res.status(200).json(
      successResponse(account, 'Account retrieved successfully')
    );
  }

  /**
   * GET /api/v1/accounts/:accountId/balance
   * Retrieves the current balance of an account.
   */
  async getAccountBalance(req, res) {
    const { accountId } = req.params;
    const balanceData = await accountService.getAccountBalance(accountId);

    return res.status(200).json(
      successResponse(balanceData, 'Account balance retrieved successfully')
    );
  }
}

module.exports = new AccountController();

