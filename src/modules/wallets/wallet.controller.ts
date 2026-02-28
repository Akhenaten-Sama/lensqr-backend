import { Request, Response } from 'express';
import { WalletService } from './wallet.service';
import { ApiResponse } from '../../shared/helpers/response.helper';
import { FundWalletDto, TransferDto, WithdrawDto } from './wallet.types';

export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  async getBalance(req: Request, res: Response): Promise<void> {
    const wallet = await this.walletService.getBalance(req.user!.id);
    ApiResponse.success(res, { wallet }, 'Wallet retrieved successfully.');
  }

  async fund(req: Request, res: Response): Promise<void> {
    const dto = req.body as FundWalletDto;
    const result = await this.walletService.fundWallet(req.user!.id, dto);
    ApiResponse.success(res, result, 'Wallet funded successfully.');
  }

  async transfer(req: Request, res: Response): Promise<void> {
    const dto = req.body as TransferDto;
    const result = await this.walletService.transfer(req.user!.id, dto);
    ApiResponse.success(res, result, 'Transfer successful.');
  }

  async withdraw(req: Request, res: Response): Promise<void> {
    const dto = req.body as WithdrawDto;
    const result = await this.walletService.withdraw(req.user!.id, dto);
    ApiResponse.success(res, result, 'Withdrawal successful.');
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await this.walletService.getTransactionHistory(req.user!.id, page, limit);

    const totalPages = Math.ceil(result.total / result.limit);
    ApiResponse.success(
      res,
      {
        transactions: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          total_pages: totalPages,
        },
      },
      'Transactions retrieved successfully.',
    );
  }
}
