import { Router, Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { userController, walletController, authenticate } from '../config/container';
import { createUserRouter } from '../modules/users/user.routes';
import { createWalletRouter } from '../modules/wallets/wallet.routes';
import { globalErrorHandler } from '../shared/middleware/error.middleware';
import { swaggerSpec } from '../config/swagger';

export function registerRoutes(app: Application): void {
  const apiRouter = Router();

  apiRouter.use('/users', createUserRouter(userController, authenticate));
  apiRouter.use('/wallets', createWalletRouter(walletController, authenticate));

  app.use('/api/v1', apiRouter);

  // Swagger UI — available at /api/docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Global error handler must be last
  app.use(globalErrorHandler);
}
