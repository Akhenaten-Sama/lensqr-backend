# Demo Credit — Wallet Service MVP

A wallet service. Users can create accounts, fund wallets, transfer funds to other users, and withdraw — with automatic Karma blacklist protection via the Lendsqr Adjutor API.

---

## Tech Stack


| Runtime => Node.js LTS (v20+) |
| Language => TypeScript 5 |
| Framework => Express 4 |
| ORM => KnexJS |
| Database =>  MySQL 8 |
| Validation => Joi |
| Testing => Jest + ts-jest |
| Auth => Faux token (base64 userId + random hex, stored in DB) |

---

## Architecture

The application follows a **3-layer module architecture**:

```
Controller:  thin HTTP layer (validates, calls service, sends response)
Service:       all business logic, transaction coordination, domain errors
Repository:  pure Knex queries, optional trx parameter for transaction support
```

Modules are organized by domain (users, wallets, transactions) rather than by layer. All dependencies are wired through constructor injection via `src/config/container.ts`.

---

## E-R Diagram

![E-R diagram](E-R.png)

```
Relationships:
  users      (1) ──── (1) wallets
  wallets    (1) ──── (*) transactions  [as primary wallet]
  wallets    (1) ──── (*) transactions  [as counterpart_wallet, nullable]
```



---

## API Reference
Postman Collection Url

https://www.postman.com/olalekan-efunkunle/demo-wallet/collection/41097181-57782465-8ef9-4686-923b-a8c215c32d4e?action=share&source=copy-link&creator=41097181


Swagger documentation used also, but the reference is below.

**Base URL**: `http://localhost:3000/api/v1`

All responses use the envelope:
```json
{ "status": "success|error", "message": "...", "data": {} }
```

### Users

#### `POST /users` — Register
```json
// Request
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone_number": "+2348012345678",
  "password": "SecurePass123"
}

// 201 Created
{
  "status": "success",
  "message": "Account created successfully.",
  "data": {
    "user": { "id": "...", "first_name": "John", "email": "john.doe@example.com" },
    "wallet": { "id": "...", "balance": "0.00", "currency": "NGN" },
    "token": "base64userId.randomhex"
  }
}

// 403 Forbidden (blacklisted)
{ "status": "error", "message": "...", "error_code": "USER_BLACKLISTED" }
```

#### `POST /users/login` — Login
```json
// Request
{ "email": "john.doe@example.com", "password": "SecurePass123" }

// 200 OK
{ "status": "success", "data": { "token": "...", "user": { ... } } }
```

#### `GET /users/me` — Profile (auth required)
```
Authorization: Bearer <token>
```

---

### Wallets (all require `Authorization: Bearer <token>`)

#### `GET /wallets/me` — Get Balance

#### `POST /wallets/fund` — Fund Wallet
```json
{ "amount": 5000.00, "reference": "FND-001" }
```

#### `POST /wallets/transfer` — Transfer
```json
{
  "recipient_email": "jane@example.com",
  "amount": 1500.00,
  "reference": "TRF-001",
  "description": "Rent payment"
}
```

#### `POST /wallets/withdraw` — Withdraw
```json
{ "amount": 2000.00, "reference": "WDR-001" }
```

#### `GET /wallets/me/transactions` — Transaction History
```
?page=1&limit=20
```

---

### Error Codes

| HTTP Status | error_code | Description |

| 400 | BAD_REQUEST | Validation failure |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | USER_BLACKLISTED | Identity on Karma blacklist |
| 404 | RESOURCE_NOT_FOUND | Entity not found |
| 409 | DUPLICATE_ENTRY | Duplicate reference or email |
| 422 | UNPROCESSABLE_ENTITY | Insufficient balance |
| 500 | INTERNAL_SERVER_ERROR | Unexpected error |

---

## Local Setup

### Prerequisites
- Node.js v20+
- MySQL 8

### 1. Clone & Install
```bash
git clone <repo-url>
cd demo-credit
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Fill in your MySQL credentials and Adjutor API key
```

### 3. Create MySQL Databases
```sql
CREATE DATABASE demo_credit;
CREATE DATABASE demo_credit_test;
```

### 4. Run Migrations
```bash
npm run migrate
```

### 5. Start Dev Server
```bash
npm run dev
# API available at http://localhost:3000
```

### 6. Run Tests
```bash
npm test               # all tests
npm run test:coverage  # with coverage report
```

### 7. Build for Production
```bash
npm run build
npm start
```

---

## Karma Blacklist

During user registration the service calls the Lendsqr Adjutor Karma API:

```
GET https://adjutor.lendsqr.com/v2/verification/karma/{identity}
```

| Adjutor response | Meaning | Outcome |

| `200` with `data !== null` | Identity is on the blacklist | Registration blocked `403 USER_BLACKLISTED` |
| `404` | Identity not found — user is clean | Registration proceeds |
| `5xx` / timeout | Adjutor is unavailable | **Fail-open** — registration proceeds |
| `200` with `"mock-response"` key | App is in Adjutor test mode | Treated as fail-open (not blacklisted) |

**Fail-open strategy:** A third-party outage never blocks new signups. The risk of occasionally onboarding a blacklisted user during an outage is lower than the risk of locking all registrations.

**Adjutor test mode:** When the Adjutor app has not yet completed KYC, the API returns a synthetic `"mock-response"` field with a fake karma payload for every identity. The service detects this key and treats the response as fail-open rather than incorrectly flagging every user as blacklisted. Once the app is toggled to live mode, the real response (404 = clean, 200 with data = blacklisted) takes effect automatically — no code change needed.

---

## Transaction Design

### Row Locking — Concurrent Request Safety

Every balance-modifying operation acquires a `SELECT FOR UPDATE` lock on the wallet row(s) inside a database transaction before reading the balance:

```
fundWallet   → locks user's wallet row
withdraw     → locks user's wallet row
transfer     → locks sender's wallet row, then recipient's wallet row
```

This prevents lost updates: if two concurrent withdrawal requests race, the second one sees the already-reduced balance after the first commits and fails with `422 Insufficient balance` rather than both succeeding.

### Idempotency — Duplicate Transaction Prevention

Every fund, transfer, and withdraw request requires a caller-supplied `reference` (max 100 chars). The `transactions` table enforces a `UNIQUE` constraint on this column.

- Submitting the same reference twice → MySQL `ER_DUP_ENTRY` → `409 DUPLICATE_ENTRY`
- The balance is **never touched twice** — the constraint fires before any balance update
- Callers can safely retry failed requests with the same reference without risk of double-debit

### Overdraft Prevention

Balance checks run **after** the row lock is acquired, ensuring the check is always against the latest committed balance:

```
withdraw / transfer:  if (balance < amount) → 422 Insufficient balance
```

The Joi validators additionally reject `amount ≤ 0` at the HTTP layer before any database work occurs.

### Audit Trail

Every transaction record stores `balance_before` and `balance_after`, giving a complete point-in-time snapshot without summing historical rows. Transfer operations create two records — a `DEBIT` on the sender and a `CREDIT` on the recipient — both linked via `counterpart_wallet_id`.

### Money Precision

All monetary values use `DECIMAL(15,2)` in the database and are never stored as `FLOAT` or `DOUBLE`, which would introduce rounding errors in financial calculations.

---

## Security & Rate Limiting

- **Rate limiting:** 100 requests per 15 minutes per IP (via `express-rate-limit`). Protects against brute-force and abuse.
- **Helmet:** HTTP security headers set on every response.
- **Password hashing:** bcryptjs with 10 salt rounds.
- **Token revocation:** Auth tokens are stored in the database — logging in generates a new token and invalidates the previous one.
- **Input sanitisation:** Joi schemas strip unknown fields from all request bodies, preventing mass-assignment attacks.
- **Sensitive field stripping:** `password_hash`, `token`, and `is_blacklisted` are never returned in API responses.

---

## Project Structure

```
src/
  config/          # DB connection, env loader, DI container
  database/        # Knex config + migrations
  modules/
    users/         # user.types, repository, service, controller, routes, validator
    wallets/       # wallet.types, repository, service, controller, routes, validator
    transactions/  # transaction.types, repository
  integrations/
    adjutor/       # AdjutorClient, AdjutorService, types
  shared/
    errors/        # AppError + HTTP error subclasses
    helpers/       # ApiResponse, asyncHandler, TokenHelper
    middleware/    # auth, error handler, Joi validation
    types/         # Express Request augmentation
  app.ts           # Express factory
  server.ts        # Entry point
tests/
  unit/            # Jest unit tests (mocked repos + external APIs)
```
