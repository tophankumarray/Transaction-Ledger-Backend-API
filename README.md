# Transaction Ledger Backend API

A production-grade, highly reliable Transaction Ledger Backend API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. The system models a double-entry style financial transaction ledger supporting authenticated access, account creation, credit/debit operations, transaction histories with pagination and filtering, strict immutability, ACID atomicity, race-condition safety, and peer-to-peer money transfers.

---

## Table of Contents
1. [Core Features & Architecture](#core-features--architecture)
2. [Authentication & Protected Routes](#authentication--protected-routes)
3. [Data Integrity & Concurrency Guarantees](#data-integrity--concurrency-guarantees)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Prerequisites & Getting Started](#prerequisites--getting-started)
   - [Option A: Zero-Setup In-Memory Mode (Recommended for testing/evaluation)](#option-a-zero-setup-in-memory-mode)
   - [Option B: Local MongoDB](#option-b-local-mongodb)
   - [Option C: Docker Compose](#option-c-docker-compose)
7. [API Documentation](#api-documentation)
   - [Authentication Endpoints (Public)](#authentication-endpoints)
     - [Register User](#register-user)
     - [Login User](#login-user)
     - [Get Current User Profile (Protected)](#get-current-user-profile)
   - [Protected Ledger Endpoints](#protected-ledger-endpoints)
     - [1. Create Account](#1-create-account)
     - [2. Get Account Balance](#2-get-account-balance)
     - [3. Get Account Details](#3-get-account-details)
     - [4. Add Transaction (Credit / Debit)](#4-add-transaction)
     - [5. Get Transaction History (Pagination & Filter)](#5-get-transaction-history)
     - [6. Bonus: Money Transfer](#6-bonus-money-transfer)
     - [7. Health Check (Public)](#7-health-check)
8. [Automated Testing & Coverage](#automated-testing--coverage)
9. [Postman Collection](#postman-collection)

---

## Core Features & Architecture

- **Clean Layered Architecture**: Clear separation of concerns into Controllers, Services, Models, Middlewares, Validators, and Utilities.
- **Dual Authentication & Protected Routes**: Protects all core financial ledger operations (`/accounts`, `/transactions`, `/transfers`) using either **JWT Bearer Tokens** (`Authorization: Bearer <token>`) or **API Keys** (`x-api-key: <key>`).
- **Strict Atomicity & ACID Guarantees**: Balance updates and ledger entries are executed inside MongoDB session transactions with snapshot read concern and majority write concern.
- **Idempotency & Duplicate Prevention**: Compound unique indexes on `(account_id, reference_id)` prevent duplicate transactions within an account, while allowing the same reference across different accounts.
- **Transaction Immutability**: Enforced both at API route level (no PUT/PATCH/DELETE endpoints) and database schema level (Mongoose pre-hooks abort any update or deletion attempt).
- **Exact Monetary Precision**: All arithmetic uses currency-safe utility helpers to prevent IEEE 754 floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
- **Comprehensive Input Validation**: Request schemas validated strictly using **Zod**.
- **Centralized Error Handling**: Standardized JSON error responses with clear HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500).

---

## Authentication & Protected Routes

All core ledger endpoints under `/api/v1/accounts`, `/api/v1/transactions`, and `/api/v1/transfers` are **protected**.

### How to Authenticate Requests:
Clients can authenticate using either of the following methods:

1. **JWT Bearer Token** (Standard for users/frontends):
   Pass the JWT received from `/auth/login` or `/auth/register` in the `Authorization` header:
   ```http
   Authorization: Bearer <jwt_token>
   ```

2. **API Key** (Standard for machine-to-machine / automated systems):
   Pass the configured API key in the `x-api-key` header:
   ```http
   x-api-key: ledger-api-key-secret-2026
   ```

If a client attempts to access a protected route without authentication or with an invalid token, the API responds with `401 Unauthorized`:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a Bearer token in Authorization header or a valid x-api-key."
  }
}
```

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
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Testing**: Jest, Supertest, MongoDB-Memory-Server

---

## Prerequisites & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

---

### Option A: Zero-Setup In-Memory Mode
> **Ideal for quick evaluation!** You do not need to install or run MongoDB. The server automatically starts an in-memory MongoDB ReplicaSet if local Mongo is unavailable or when `USE_IN_MEMORY_DB=true`.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start the application:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

---

### Option B: Local MongoDB
1. Ensure MongoDB service is running locally on port 27017:
   ```bash
   mongod --dbpath /data/db
   ```
2. Start the application:
   ```bash
   npm start
   ```

---

### Option C: Docker Compose
```bash
docker-compose up --build
```
The API will be available at `http://localhost:3000`.

---

## API Documentation

All API endpoints are prefixed with `/api/v1`.

---

### Authentication Endpoints

#### Register User
- **URL**: `POST /api/v1/auth/register` (Public)
- **Request Body**:
  ```json
  {
    "username": "alice_ledger",
    "email": "alice@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "c138988c-90b5-4b13-a41e-5be746ff585f",
        "username": "alice_ledger",
        "email": "alice@example.com",
        "role": "user",
        "created_at": "2026-10-28T21:40:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Login User
- **URL**: `POST /api/v1/auth/login` (Public)
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "securePassword123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "c138988c-90b5-4b13-a41e-5be746ff585f",
        "username": "alice_ledger",
        "email": "alice@example.com",
        "role": "user"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Get Current User Profile
- **URL**: `GET /api/v1/auth/me` (Protected - Requires Bearer token)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Current user profile retrieved",
    "data": {
      "id": "c138988c-90b5-4b13-a41e-5be746ff585f",
      "username": "alice_ledger",
      "email": "alice@example.com",
      "role": "user"
    }
  }
  ```

---

### Protected Ledger Endpoints

#### 1. Create Account
Creates a new account. Initial balance is always `0`. Setting initial balance is rejected.

- **URL**: `POST /api/v1/accounts` (Protected)
- **Headers**: `Authorization: Bearer <token>` or `x-api-key: ledger-api-key-secret-2026`
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
    -H "Authorization: Bearer <your_jwt_token>" \
    -d '{"name": "Alice Smith"}'
  ```

---

#### 2. Get Account Balance
Retrieves the current balance for an existing account.

- **URL**: `GET /api/v1/accounts/:accountId/balance` (Protected)
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

---

#### 3. Get Account Details
- **URL**: `GET /api/v1/accounts/:accountId` (Protected)
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

#### 4. Add Transaction
Applies a `credit` or `debit` transaction to an account atomically.

- **URL**: `POST /api/v1/accounts/:accountId/transactions` (Protected)
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

---

#### 5. Get Transaction History
Retrieves transactions for an account with sorting (latest-first), filtering, and pagination.

- **URL**: `GET /api/v1/accounts/:accountId/transactions` (Protected)
- **Query Parameters**:
  - `type`: `credit` | `debit` (optional)
  - `page`: default 1
  - `limit`: default 10 (max 100)
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
      }
    ],
    "meta": {
      "current_page": 1,
      "page_size": 10,
      "total_records": 1,
      "total_pages": 1
    }
  }
  ```

---

#### 6. Bonus: Money Transfer
Atomically transfers funds from a source account to a destination account.

- **URL**: `POST /api/v1/transfers` (Protected)
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
        "reference_id": "transfer-oct-01"
      },
      "source_account": { "id": "...", "new_balance": 70.00 },
      "destination_account": { "id": "...", "new_balance": 80.00 }
    }
  }
  ```

---

#### 7. Health Check
- **URL**: `GET /api/v1/health` (Public)
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

The test suite contains **49 automated unit and integration tests** verifying authentication, error responses, ACID atomicity, and edge cases:

Run the test suite:
```bash
npm test
```

Run tests with code coverage analysis:
```bash
npm run test:coverage
```

### Test Suite Overview:
- `tests/auth.test.js`: User registration, duplicate checks, login, JWT issuance, password verification, 401 unauthenticated protection, and API key auth.
- `tests/accounts.test.js`: Account creation, balance queries, client-set balance rejection.
- `tests/transactions.test.js`: Credit, debit, overdraft checks, idempotency, cross-account references, decimal validation.
- `tests/transactionHistory.test.js`: Filtering, pagination, sorting (latest first), not-found behavior.
- `tests/dataIntegrity.test.js`: Multi-step consistency example (`0 + 100 + 50 - 30 - 20 = 100`), transaction immutability hooks.
- `tests/transfers.test.js`: Bonus P2P transfer, atomic rollback on failure, duplicate rejection, same-account prevention.
- `tests/health.test.js`: Root, health, and 404 route handling.

---

## Postman Collection

A pre-configured Postman Collection is located at the root of the project:
[`postman_collection.json`](postman_collection.json)

### To use:
1. Open Postman.
2. Click **Import** -> Select `postman_collection.json`.
3. The collection automatically captures the JWT token from `Auth - 1. Register User` or `Auth - 2. Login User` and automatically injects it into all subsequent protected ledger requests!
