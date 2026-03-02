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

  /**
   * @openapi
   * /wallets/me:
   *   get:
   *     tags: [Wallets]
   *     summary: Get wallet balance
   *     description: Returns the authenticated user's wallet with current balance.
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Wallet retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: success }
   *                 message: { type: string, example: Wallet retrieved successfully. }
   *                 data:
   *                   type: object
   *                   properties:
   *                     wallet:
   *                       $ref: '#/components/schemas/Wallet'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/me', asyncHandler(walletController.getBalance.bind(walletController)));

  /**
   * @openapi
   * /wallets/fund:
   *   post:
   *     tags: [Wallets]
   *     summary: Fund wallet
   *     description: >
   *       Credits the authenticated user's wallet. The `reference` field is an
   *       idempotency key — submitting the same reference twice returns a 409 rather
   *       than double-crediting the wallet.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FundWalletRequest'
   *     responses:
   *       200:
   *         description: Wallet funded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: success }
   *                 message: { type: string, example: Wallet funded successfully. }
   *                 data:
   *                   type: object
   *                   properties:
   *                     transaction:
   *                       $ref: '#/components/schemas/Transaction'
   *                     wallet:
   *                       $ref: '#/components/schemas/Wallet'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         description: Duplicate reference (idempotency key already used)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: error
   *               message: A resource with this identifier already exists.
   *               error_code: DUPLICATE_ENTRY
   */
  router.post(
    '/fund',
    validate(fundWalletSchema),
    asyncHandler(walletController.fund.bind(walletController)),
  );

  /**
   * @openapi
   * /wallets/transfer:
   *   post:
   *     tags: [Wallets]
   *     summary: Transfer funds to another user
   *     description: >
   *       Atomically debits the sender's wallet and credits the recipient's wallet.
   *       Both wallets are locked with SELECT FOR UPDATE to prevent race conditions.
   *       A DEBIT transaction is recorded for the sender and a CREDIT transaction for the recipient.
   *       Self-transfers are rejected.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransferRequest'
   *     responses:
   *       200:
   *         description: Transfer successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: success }
   *                 message: { type: string, example: Transfer successful. }
   *                 data:
   *                   type: object
   *                   properties:
   *                     transaction:
   *                       $ref: '#/components/schemas/Transaction'
   *                     wallet:
   *                       $ref: '#/components/schemas/Wallet'
   *       400:
   *         description: Validation error or self-transfer attempt
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         description: Sender or recipient wallet not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Duplicate reference
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         $ref: '#/components/responses/InsufficientBalance'
   */
  router.post(
    '/transfer',
    validate(transferSchema),
    asyncHandler(walletController.transfer.bind(walletController)),
  );

  /**
   * @openapi
   * /wallets/withdraw:
   *   post:
   *     tags: [Wallets]
   *     summary: Withdraw funds
   *     description: >
   *       Debits the authenticated user's wallet. Overdrafts are rejected with 422.
   *       The `reference` field is an idempotency key.
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/WithdrawRequest'
   *     responses:
   *       200:
   *         description: Withdrawal successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: success }
   *                 message: { type: string, example: Withdrawal successful. }
   *                 data:
   *                   type: object
   *                   properties:
   *                     transaction:
   *                       $ref: '#/components/schemas/Transaction'
   *                     wallet:
   *                       $ref: '#/components/schemas/Wallet'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         description: Duplicate reference
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         $ref: '#/components/responses/InsufficientBalance'
   */
  router.post(
    '/withdraw',
    validate(withdrawSchema),
    asyncHandler(walletController.withdraw.bind(walletController)),
  );

  /**
   * @openapi
   * /wallets/me/transactions:
   *   get:
   *     tags: [Wallets]
   *     summary: Get transaction history
   *     description: Returns a paginated list of the authenticated user's transactions, ordered newest first.
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of records per page
   *     responses:
   *       200:
   *         description: Transactions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: success }
   *                 message: { type: string, example: Transactions retrieved successfully. }
   *                 data:
   *                   type: object
   *                   properties:
   *                     transactions:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Transaction'
   *                     pagination:
   *                       $ref: '#/components/schemas/Pagination'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get(
    '/me/transactions',
    validate(transactionHistorySchema, 'query'),
    asyncHandler(walletController.getTransactions.bind(walletController)),
  );

  return router;
}
