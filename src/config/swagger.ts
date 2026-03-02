import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Demo Credit Wallet API',
      version: '1.0.0',
      description:
        'MVP wallet service — create accounts, fund wallets, transfer funds, and withdraw. ' +
        'Users on the Lendsqr Adjutor Karma blacklist cannot be onboarded.',
      contact: {
        name: 'Demo Credit',
      },
    },
    servers: [
      {
        url: 'https://olalekanefunkunle-lendsqr-be-test.up.railway.app/api/v1',
        description: 'Production server (Railway)',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'FauxToken',
          description: 'Faux token returned by POST /users or POST /users/login',
        },
      },
      schemas: {
        // ── Users ──────────────────────────────────────────────────────────
        CreateUserRequest: {
          type: 'object',
          required: ['first_name', 'last_name', 'email', 'phone_number', 'password'],
          properties: {
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
            phone_number: { type: 'string', example: '+2348012345678' },
            password: { type: 'string', minLength: 8, example: 'SecurePass123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
            password: { type: 'string', example: 'SecurePass123' },
          },
        },
        PublicUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            phone_number: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        // ── Wallet ─────────────────────────────────────────────────────────
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            balance: { type: 'number', example: 5000.0 },
            currency: { type: 'string', example: 'NGN' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        FundWalletRequest: {
          type: 'object',
          required: ['amount', 'reference'],
          properties: {
            amount: { type: 'number', minimum: 0.01, example: 5000.0 },
            reference: { type: 'string', maxLength: 100, example: 'FND-20240101-001' },
            description: { type: 'string', maxLength: 500, example: 'Top up' },
          },
        },
        TransferRequest: {
          type: 'object',
          required: ['recipient_email', 'amount', 'reference'],
          properties: {
            recipient_email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
            amount: { type: 'number', minimum: 0.01, example: 1500.0 },
            reference: { type: 'string', maxLength: 100, example: 'TRF-20240101-001' },
            description: { type: 'string', maxLength: 500, example: 'Rent payment' },
          },
        },
        WithdrawRequest: {
          type: 'object',
          required: ['amount', 'reference'],
          properties: {
            amount: { type: 'number', minimum: 0.01, example: 2000.0 },
            reference: { type: 'string', maxLength: 100, example: 'WDR-20240101-001' },
            description: { type: 'string', maxLength: 500, example: 'Bank withdrawal' },
          },
        },
        // ── Transaction ────────────────────────────────────────────────────
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reference: { type: 'string', example: 'TRF-20240101-001' },
            wallet_id: { type: 'string', format: 'uuid' },
            counterpart_wallet_id: { type: 'string', format: 'uuid', nullable: true },
            type: { type: 'string', enum: ['CREDIT', 'DEBIT'] },
            category: { type: 'string', enum: ['FUNDING', 'TRANSFER', 'WITHDRAWAL'] },
            amount: { type: 'number', example: 1500.0 },
            balance_before: { type: 'number', example: 5000.0 },
            balance_after: { type: 'number', example: 3500.0 },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        // ── Common responses ───────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'A descriptive error message.' },
            error_code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 47 },
            total_pages: { type: 'integer', example: 3 },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid Authorization token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'error', message: 'Token is invalid or has been revoked.', error_code: 'UNAUTHORIZED' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        ValidationError: {
          description: 'Request body failed Joi validation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'error', message: 'Amount must be a positive number', error_code: 'BAD_REQUEST' },
            },
          },
        },
        InsufficientBalance: {
          description: 'Insufficient wallet balance',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'error', message: 'Insufficient wallet balance.', error_code: 'UNPROCESSABLE_ENTITY' },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Users', description: 'Account registration, login, and profile' },
      { name: 'Wallets', description: 'Wallet balance, funding, transfers, and withdrawals' },
    ],
  },
  apis: [
    path.join(__dirname, '../modules/users/user.routes.{ts,js}'),
    path.join(__dirname, '../modules/wallets/wallet.routes.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
