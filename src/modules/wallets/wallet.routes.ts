import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { validate } from '../../shared/middleware/validate.middleware';
import {
  fundWalletSchema,
  transferSchema,
  withdrawSchema,
  transactionHistorySchema,
} from './wallet.validator';

export function createWalletRouter(
  walletController: WalletController,
  authenticate: ReturnType<typeof import('../../shared/middleware/auth.middleware').createAuthMiddleware>,
): Router {
  const router = Router();

  // All wallet routes require authentication
  router.use(authenticate);

  router.get('/me', asyncHandler(walletController.getBalance.bind(walletController)));

  router.post(
    '/fund',
    validate(fundWalletSchema),
    asyncHandler(walletController.fund.bind(walletController)),
  );

  router.post(
    '/transfer',
    validate(transferSchema),
    asyncHandler(walletController.transfer.bind(walletController)),
  );

  router.post(
    '/withdraw',
    validate(withdrawSchema),
    asyncHandler(walletController.withdraw.bind(walletController)),
  );

  router.get(
    '/me/transactions',
    validate(transactionHistorySchema, 'query'),
    asyncHandler(walletController.getTransactions.bind(walletController)),
  );

  return router;
}
