import { Router } from 'express';
import { userController, walletController, authenticate } from '../config/container';
import { createUserRouter } from '../modules/users/user.routes';
import { createWalletRouter } from '../modules/wallets/wallet.routes';
import { globalErrorHandler } from '../shared/middleware/error.middleware';
import { Application } from 'express';

export function registerRoutes(app: Application): void {
  const apiRouter = Router();

  apiRouter.use('/users', createUserRouter(userController, authenticate));
  apiRouter.use('/wallets', createWalletRouter(walletController, authenticate));

  app.use('/api/v1', apiRouter);

  // Global error handler must be last
  app.use(globalErrorHandler);
}
