import transferService from '../services/transferService.js';
import { successResponse } from '../utils/responseFormatter.js';

class TransferController {
  /**
   * POST /api/v1/transfers
   * Atomically transfers money from source account to destination account.
   */
  async transferMoney(req, res) {
    const {
      source_account_id,
      destination_account_id,
      amount,
      description,
      reference_id,
    } = req.body;

    const result = await transferService.transferMoney({
      sourceAccountId: source_account_id,
      destinationAccountId: destination_account_id,
      amount,
      description,
      referenceId: reference_id,
    });

    return res.status(201).json(
      successResponse(result, 'Money transferred successfully')
    );
  }
}

export const transferController = new TransferController();
export default transferController;
