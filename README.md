# Transaction Ledger Backend API

A production-grade, highly reliable Transaction Ledger Backend API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. The system models a double-entry style financial transaction ledger supporting account creation, credit/debit operations, transaction histories with pagination and filtering, strict immutability, ACID atomicity, race-condition safety, and peer-to-peer money transfers.

---

## Table of Contents
1. [Core Features & Architecture](#core-features--architecture)
2. [Data Integrity & Concurrency Guarantees](#data-integrity--concurrency-guarantees)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites & Getting Started](#prerequisites--getting-started)
   - [Option A: Zero-Setup In-Memory Mode (Recommended for testing/evaluation)](#option-a-zero-setup-in-memory-mode)
   - [Option B: Local MongoDB](#option-b-local-mongodb)
   - [Option C: Docker Compose](#option-c-docker-compose)
6. [API Documentation](#api-documentation)
   - [1. Create Account](#1-create-account)
   - [2. Get Account Balance](#2-get-account-balance)
   - [3. Get Account Details](#3-get-account-details)
   - [4. Add Transaction (Credit / Debit)](#4-add-transaction)
   - [5. Get Transaction History (Pagination & Filter)](#5-get-transaction-history)
   - [6. Bonus: Money Transfer](#6-bonus-money-transfer)
   - [7. Health Check](#7-health-check)
7. [Automated Testing & Coverage](#automated-testing--coverage)
8. [Postman Collection](#postman-collection)

---

## Core Features & Architecture

- **Clean Layered Architecture**: Clear separation of concerns into Controllers, Services, Models, Middlewares, Validators, and Utilities.
- **Strict Atomicity & ACID Guarantees**: Balance updates and ledger entries are executed inside MongoDB session transactions with snapshot read concern and majority write concern.
- **Idempotency & Duplicate Prevention**: Compound unique indexes on `(account_id, reference_id)` prevent duplicate transactions within an account, while allowing the same reference across different accounts.
- **Transaction Immutability**: Enforced both at API route level (no PUT/PATCH/DELETE endpoints) and database schema level (Mongoose pre-hooks abort any update or deletion attempt).
- **Exact Monetary Precision**: All arithmetic uses currency-safe utility helpers to prevent IEEE 754 floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
- **Comprehensive Input Validation**: Request schemas validated strictly using **Zod**.
- **Centralized Error Handling**: Standardized JSON error responses with clear HTTP status codes (200, 201, 400, 404, 409, 500).

---

## Data Integrity & Concurrency Guarantees

### 1. Atomicity
Creating a transaction record and adjusting the account balance are treated as one atomic operation:
```
           +-----------------------------+
           | Begin MongoDB Transaction   |
           +--------------+--------------+
                          |
             [Verify Account & Balance]
                          |
             [Update Balance atomically]
                          |
             [Create Immutable Transaction]
                          |
              +-----------v-----------+
              | Commit Transaction    |
              +-----------------------+
```
If any check or insert fails (e.g., duplicate `reference_id` or database error), the session aborts and rolls back immediately, leaving balances untouched.

### 2. Concurrency Safety
Conditional updates (`$gte: amount`) protect against concurrent debit race conditions, ensuring an account can never overdraft even under concurrent bursts.

### 3. Duplicate Handling
Submitting a transaction with the same `reference_id` for the same account returns `409 Conflict` (`DUPLICATE_TRANSACTION_REFERENCE`). The transaction is rejected, and the balance remains unchanged.

---

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Testing**: Jest, Supertest, MongoDB-Memory-Server

---

## Project Structure

```
├── src/
│   ├── app.js                   # Express application setup
│   ├── server.js                # Server entry point & graceful shutdown
│   ├── config/
│   │   ├── database.js          # MongoDB connection & transaction runner
│   │   └── env.js               # Environment variables configuration
│   ├── constants/
│   │   └── transactionTypes.js  # Transaction types & error code definitions
│   ├── controllers/
│   │   ├── accountController.js # Account endpoints handler
│   │   ├── transactionController.js # Transaction & history handler
│   │   └── transferController.js    # Bonus transfer handler
│   ├── errors/                  # Custom error hierarchy (AppError, NotFound, etc.)
│   ├── middlewares/
│   │   ├── errorHandler.js      # Global centralized error handler
│   │   ├── notFoundHandler.js   # 404 route handler
│   │   └── validate.js          # Zod schema validation middleware
│   ├── models/
│   │   ├── Account.js           # Account schema
│   │   ├── Transaction.js       # Transaction schema with constraints & immutability
│   │   └── Transfer.js          # Bonus Transfer schema
│   ├── routes/
│   │   ├── accountRoutes.js     # /api/v1/accounts
│   │   ├── transactionRoutes.js # /api/v1/transactions
│   │   ├── transferRoutes.js    # /api/v1/transfers
│   │   └── index.js             # Route aggregator & health check
│   ├── services/
│   │   ├── accountService.js    # Account business logic
│   │   ├── transactionService.js# Atomic transactions & history retrieval
│   │   └── transferService.js   # Atomic money transfer logic
│   ├── utils/
│   │   ├── asyncHandler.js      # Async handler wrapper
│   │   ├── math.js              # Currency rounding & arithmetic
│   │   └── responseFormatter.js # Standardized JSON formatters
│   └── validators/
│       ├── accountValidator.js
│       ├── transactionValidator.js
│       └── transferValidator.js
├── tests/                       # Complete automated Jest test suite
│   ├── accounts.test.js
│   ├── dataIntegrity.test.js
│   ├── health.test.js
│   ├── setup.js
│   ├── transactionHistory.test.js
│   ├── transactions.test.js
│   └── transfers.test.js
├── docker-compose.yml
├── Dockerfile
├── package.json
├── postman_collection.json
└── README.md
```

---

## Prerequisites & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

### Installation
Clone the repository and install dependencies:
```bash
git clone <repository_url>
cd "Transaction Backend API"
npm install
```

---

### Option A: Zero-Setup In-Memory Mode
> **Ideal for quick evaluation!** You do not need to install or run MongoDB. The server automatically starts an in-memory MongoDB ReplicaSet if local Mongo is unavailable or when `USE_IN_MEMORY_DB=true`.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set `USE_IN_MEMORY_DB=true` in `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   USE_IN_MEMORY_DB=true
   ```
3. Start the application:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

---

### Option B: Local MongoDB
If you have MongoDB running locally on port 27017:
1. Ensure MongoDB service is running:
   ```bash
   mongod --dbpath /data/db
   ```
2. Configure `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/transaction_ledger
   USE_IN_MEMORY_DB=false
   ```
3. Start the application:
   ```bash
   npm start
   ```

---

### Option C: Docker Compose
Run the entire stack (API server + MongoDB container) with one command:
```bash
docker-compose up --build
```
The API will be available at `http://localhost:3000`.

---

## API Documentation

All API endpoints are prefixed with `/api/v1`.

### Response Structure
**Success:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "meta": { ... } // optional pagination or metadata
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [ ... ] // optional validation details
  }
}
```

---

### 1. Create Account
Creates a new account. Initial balance is always `0`. Setting initial balance is rejected.

- **URL**: `POST /api/v1/accounts`
- **Request Body**:
  ```json
  {
    "name": "Alice Smith"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
      "name": "Alice Smith",
      "balance": 0,
      "created_at": "2026-10-28T21:00:00.000Z"
    }
  }
  ```
- **Example cURL**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/accounts \
    -H "Content-Type: application/json" \
    -d '{"name": "Alice Smith"}'
  ```

---

### 2. Get Account Balance
Retrieves the current balance for an existing account.

- **URL**: `GET /api/v1/accounts/:accountId/balance`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Account balance retrieved successfully",
    "data": {
      "account_id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
      "balance": 150.00
    }
  }
  ```
- **Error Response** (`404 Not Found`):
  ```json
  {
    "success": false,
    "error": {
      "code": "ACCOUNT_NOT_FOUND",
      "message": "Account with ID 'unknown-id' was not found"
    }
  }
  ```
- **Example cURL**:
  ```bash
  curl http://localhost:3000/api/v1/accounts/e45bdf4b-6147-4fbb-9177-0a256911c79e/balance
  ```

---

### 3. Get Account Details
Retrieves full details of an account.

- **URL**: `GET /api/v1/accounts/:accountId`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Account retrieved successfully",
    "data": {
      "id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
      "name": "Alice Smith",
      "balance": 150.00,
      "created_at": "2026-10-28T21:00:00.000Z"
    }
  }
  ```

---

### 4. Add Transaction
Applies a `credit` or `debit` transaction to an account.

- **URL**: `POST /api/v1/accounts/:accountId/transactions`
  *(Also supports direct `POST /api/v1/transactions` with `account_id` in request body)*
- **Request Body**:
  ```json
  {
    "type": "credit",
    "amount": 100.50,
    "description": "Salary deposit",
    "reference_id": "tx-salary-oct-2026"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Transaction processed successfully",
    "data": {
      "id": "a93e3e0d-1e1b-4fbf-9311-bfad4b302c11",
      "account_id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
      "type": "credit",
      "amount": 100.50,
      "description": "Salary deposit",
      "reference_id": "tx-salary-oct-2026",
      "created_at": "2026-10-28T21:05:00.000Z"
    },
    "meta": {
      "current_balance": 100.50
    }
  }
  ```
- **Debit with Insufficient Balance** (`400 Bad Request`):
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_BALANCE",
      "message": "Insufficient balance for debit. Current balance is 100.00, requested debit is 150.00",
      "details": {
        "current_balance": 100.00,
        "requested_amount": 150.00
      }
    }
  }
  ```
- **Duplicate Reference ID** (`409 Conflict`):
  ```json
  {
    "success": false,
    "error": {
      "code": "DUPLICATE_TRANSACTION_REFERENCE",
      "message": "A transaction with reference_id 'tx-salary-oct-2026' already exists for account 'e45bdf4b-6147-4fbb-9177-0a256911c79e'. Account balance unchanged."
    }
  }
  ```
- **Example cURL**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/accounts/e45bdf4b-6147-4fbb-9177-0a256911c79e/transactions \
    -H "Content-Type: application/json" \
    -d '{
      "type": "credit",
      "amount": 100,
      "description": "Initial credit",
      "reference_id": "ref-001"
    }'
  ```

---

### 5. Get Transaction History
Retrieves transactions for an account with sorting (latest-first), filtering, and pagination.

- **URL**: `GET /api/v1/accounts/:accountId/transactions`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |-----------|------|----------|---------|-------------|
  | `type` | string | No | `all` | Filter by `credit` or `debit` |
  | `page` | integer | No | `1` | Page number (min 1) |
  | `limit` | integer | No | `10` | Records per page (min 1, max 100) |
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Transaction history retrieved successfully",
    "data": [
      {
        "id": "b18281ef-221f-4b07-a37a-d023f03bba80",
        "account_id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
        "type": "debit",
        "amount": 30.00,
        "description": "Groceries",
        "reference_id": "ref-002",
        "created_at": "2026-10-28T21:10:00.000Z"
      },
      {
        "id": "a93e3e0d-1e1b-4fbf-9311-bfad4b302c11",
        "account_id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
        "type": "credit",
        "amount": 100.00,
        "description": "Initial credit",
        "reference_id": "ref-001",
        "created_at": "2026-10-28T21:05:00.000Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "page_size": 10,
      "total_records": 2,
      "total_pages": 1
    }
  }
  ```
- **Example cURL (Credit transactions on page 1)**:
  ```bash
  curl "http://localhost:3000/api/v1/accounts/e45bdf4b-6147-4fbb-9177-0a256911c79e/transactions?type=credit&page=1&limit=5"
  ```

---

### 6. Bonus: Money Transfer
Atomically transfers funds from a source account to a destination account.
- Creates a Debit transaction on the source account and a Credit transaction on the destination account.
- Debiting source and crediting destination are wrapped in an atomic MongoDB transaction.
- If source has insufficient balance or either account does not exist, the entire transfer is rolled back.

- **URL**: `POST /api/v1/transfers`
- **Request Body**:
  ```json
  {
    "source_account_id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
    "destination_account_id": "b901a182-38d1-4ee1-b703-91ca5b430881",
    "amount": 30.00,
    "description": "Rent contribution",
    "reference_id": "transfer-oct-01"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Money transferred successfully",
    "data": {
      "transfer": {
        "id": "893d9b01-bf10-48e0-a922-817bfb9921e0",
        "source_account_id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
        "destination_account_id": "b901a182-38d1-4ee1-b703-91ca5b430881",
        "amount": 30.00,
        "description": "Rent contribution",
        "reference_id": "transfer-oct-01",
        "source_transaction_id": "31bb18b9-e152-47ec-a232-a5416b2e3c04",
        "destination_transaction_id": "f5195eb4-3c25-4b08-8e65-27a3f443c2c1",
        "created_at": "2026-10-28T21:15:00.000Z"
      },
      "source_account": {
        "id": "e45bdf4b-6147-4fbb-9177-0a256911c79e",
        "previous_balance": 100.00,
        "new_balance": 70.00
      },
      "destination_account": {
        "id": "b901a182-38d1-4ee1-b703-91ca5b430881",
        "previous_balance": 50.00,
        "new_balance": 80.00
      }
    }
  }
  ```

---

### 7. Health Check
- **URL**: `GET /api/v1/health`
- **Response** (`200 OK`):
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-28T21:20:00.000Z",
    "uptime": 45.2,
    "acid_transactions_enabled": true
  }
  ```

---

## Automated Testing & Coverage

The test suite contains **36 automated unit and integration tests** verifying all requirements, edge cases, error codes, and concurrency rules.

Tests run against an isolated **in-memory MongoDB ReplicaSet** (`mongodb-memory-server`), ensuring zero external setup is required.

Run the test suite:
```bash
npm test
```

Run tests with code coverage analysis:
```bash
npm run test:coverage
```

### Test Suite Summary:
- `tests/accounts.test.js`: Account creation, validation, balance queries, client-set balance rejection.
- `tests/transactions.test.js`: Credit, debit, overdraft checks, idempotency, cross-account references, decimal validation.
- `tests/transactionHistory.test.js`: Filtering, pagination, sorting (latest first), not-found behavior.
- `tests/dataIntegrity.test.js`: Multi-step consistency example (`0 + 100 + 50 - 30 - 20 = 100`), transaction immutability hooks.
- `tests/transfers.test.js`: Bonus P2P transfer, atomic rollback on failure, duplicate rejection, same-account prevention.
- `tests/health.test.js`: Root, health, and 404 route handling.

---

## Postman Collection

A pre-configured Postman Collection is provided in the repository root:
`postman_collection.json`

### To use:
1. Open Postman.
2. Click **Import** -> Select `postman_collection.json`.
3. The collection includes environment variables (`baseUrl`, `accountId`, `accountBId`) and automatically captures generated account IDs between test steps.
