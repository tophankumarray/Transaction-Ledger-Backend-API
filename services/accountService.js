import Account from '../models/Account.js';
import { NotFoundError, BadRequestError } from '../errors/index.js';
import { ERROR_CODES } from '../constants/transactionTypes.js';

class AccountService {
  /**
   * Creates a new account with an initial balance of 0.
   *
   * @param {object} param0
   * @param {string} param0.name - Account holder name
   * @returns {Promise<Account>}
   */
  async createAccount({ name }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestError('Account name is required', ERROR_CODES.VALIDATION_ERROR);
    }

    const account = new Account({
      name: name.trim(),
      balance: 0,
    });

    await account.save();
    return account.toJSON();
  }

  /**
   * Fetches an account by its unique identifier.
   *
   * @param {string} accountId
   * @returns {Promise<Account>}
   */
  async getAccountById(accountId) {
    const account = await Account.findOne({ id: accountId });
    if (!account) {
      throw new NotFoundError(
        `Account with ID '${accountId}' was not found`,
        ERROR_CODES.ACCOUNT_NOT_FOUND
      );
    }
    return account.toJSON();
  }

  /**
   * Retrieves the current balance of an account.
   *
   * @param {string} accountId
   * @returns {Promise<{ account_id: string, balance: number }>}
   */
  async getAccountBalance(accountId) {
    const account = await Account.findOne({ id: accountId }, { id: 1, balance: 1 });
    if (!account) {
      throw new NotFoundError(
        `Account with ID '${accountId}' was not found`,
        ERROR_CODES.ACCOUNT_NOT_FOUND
      );
    }

    return {
      account_id: account.id,
      balance: account.balance,
    };
  }
}

export const accountService = new AccountService();
export default accountService;
