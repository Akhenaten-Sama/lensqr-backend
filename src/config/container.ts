import db from './database';
import { env } from './environment';

// Repositories
import { UserRepository } from '../modules/users/user.repository';
import { WalletRepository } from '../modules/wallets/wallet.repository';
import { TransactionRepository } from '../modules/transactions/transaction.repository';

// Integrations
import { AdjutorClient } from '../integrations/adjutor/adjutor.client';
import { AdjutorService } from '../integrations/adjutor/adjutor.service';

// Services
import { UserService } from '../modules/users/user.service';
import { WalletService } from '../modules/wallets/wallet.service';

// Controllers
import { UserController } from '../modules/users/user.controller';
import { WalletController } from '../modules/wallets/wallet.controller';

// Middleware factory
import { createAuthMiddleware } from '../shared/middleware/auth.middleware';

// ─── Repositories ─────────────────────────────────────────────────────────────
const userRepository = new UserRepository(db);
const walletRepository = new WalletRepository(db);
const transactionRepository = new TransactionRepository(db);

// ─── Integrations ─────────────────────────────────────────────────────────────
const adjutorClient = new AdjutorClient(env.ADJUTOR_BASE_URL, env.ADJUTOR_API_KEY);
const adjutorService = new AdjutorService(adjutorClient);

// ─── Services ─────────────────────────────────────────────────────────────────
const userService = new UserService(db, userRepository, walletRepository, adjutorService);
const walletService = new WalletService(db, walletRepository, transactionRepository, userRepository);

// ─── Controllers ──────────────────────────────────────────────────────────────
const userController = new UserController(userService);
const walletController = new WalletController(walletService);

// ─── Middleware ───────────────────────────────────────────────────────────────
const authenticate = createAuthMiddleware(userRepository);

export { userController, walletController, authenticate };
