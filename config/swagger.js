import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Transaction Ledger Backend API',
    version: '1.0.0',
    description:
      'A production-grade, highly reliable Transaction Ledger API built with Express and MongoDB. Supports double-entry ledger transactions, strict ACID atomicity, idempotency, immutability, and peer-to-peer transfers.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: "Enter your JWT token obtained from '/api/v1/auth/login' or '/api/v1/auth/register'",
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Enter API Key (Default configured key: ledger-api-key-secret-2026)',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'd3b07384-d113-46c0-a7d0-14e3049b7759' },
          username: { type: 'string', example: 'alice_ledger' },
          email: { type: 'string', example: 'alice@example.com' },
          role: { type: 'string', example: 'user' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Account: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          name: { type: 'string', example: 'Alice Savings Account' },
          balance: { type: 'number', format: 'float', example: 250.5 },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'tx-89b1c2-uuid' },
          account_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          type: { type: 'string', enum: ['credit', 'debit'], example: 'credit' },
          amount: { type: 'number', format: 'float', example: 100.0 },
          description: { type: 'string', example: 'Account initial deposit' },
          reference_id: { type: 'string', example: 'REF-DEP-001' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Transfer: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'tr-99b2c3-uuid' },
          source_account_id: { type: 'string', example: 'account-alice-id' },
          destination_account_id: { type: 'string', example: 'account-bob-id' },
          amount: { type: 'number', format: 'float', example: 50.0 },
          description: { type: 'string', example: 'Payment for groceries' },
          reference_id: { type: 'string', example: 'TRANSFER-REF-101' },
          source_transaction_id: { type: 'string', example: 'tx-debit-id' },
          destination_transaction_id: { type: 'string', example: 'tx-credit-id' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    { BearerAuth: [] },
    { ApiKeyAuth: [] },
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Registers a new user and returns their user profile and JWT auth token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'alice_ledger', minLength: 3, maxLength: 30 },
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', format: 'password', example: 'securePassword123', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'User with email/username already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in user',
        description: 'Authenticates with email and password and returns a JWT token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', format: 'password', example: 'securePassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Retrieves current authenticated user details from the JWT token.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Current user profile retrieved' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/accounts': {
      post: {
        tags: ['Accounts'],
        summary: 'Create a new account',
        description: 'Creates an account with an initial balance of 0. Initial balance cannot be set by client.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Alice Savings Account', minLength: 1, maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Account created successfully' },
                    data: { $ref: '#/components/schemas/Account' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error (e.g. initial balance specified)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/accounts/{accountId}/balance': {
      get: {
        tags: ['Accounts'],
        summary: 'Get account balance',
        description: 'Returns the current balance for the specified account ID.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
        ],
        responses: {
          200: {
            description: 'Balance retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Account balance retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        account_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                        balance: { type: 'number', example: 250.5 },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Account not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/accounts/{accountId}': {
      get: {
        tags: ['Accounts'],
        summary: 'Get account details',
        description: 'Retrieves full details of a specific account.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
        ],
        responses: {
          200: {
            description: 'Account retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Account retrieved successfully' },
                    data: { $ref: '#/components/schemas/Account' },
                  },
                },
              },
            },
          },
          404: { description: 'Account not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/accounts/{accountId}/transactions': {
      post: {
        tags: ['Transactions'],
        summary: 'Add transaction to account (Nested endpoint)',
        description: 'Adds a credit or debit transaction to the account with ACID atomicity and idempotency protection.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'amount', 'reference_id'],
                properties: {
                  type: { type: 'string', enum: ['credit', 'debit'], example: 'credit' },
                  amount: { type: 'number', format: 'float', example: 150.0 },
                  description: { type: 'string', example: 'Bonus deposit' },
                  reference_id: { type: 'string', example: 'REF-TX-001' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Transaction processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Transaction processed successfully' },
                    data: { $ref: '#/components/schemas/Transaction' },
                    meta: {
                      type: 'object',
                      properties: {
                        current_balance: { type: 'number', example: 400.5 },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Insufficient balance or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Account not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Duplicate reference_id for this account', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction history for account',
        description: 'Retrieves transaction history with sorting (latest first), pagination, and optional filtering by type.',
        parameters: [
          {
            name: 'accountId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['credit', 'debit'] },
            description: 'Filter by credit or debit',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
            description: 'Page number (>= 1)',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10 },
            description: 'Records per page (1 - 100)',
          },
        ],
        responses: {
          200: {
            description: 'Transaction history retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Transaction history retrieved successfully' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        current_page: { type: 'integer', example: 1 },
                        page_size: { type: 'integer', example: 10 },
                        total_records: { type: 'integer', example: 25 },
                        total_pages: { type: 'integer', example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Account not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/transactions': {
      post: {
        tags: ['Transactions'],
        summary: 'Add transaction (Direct endpoint)',
        description: 'Adds a credit or debit transaction with account_id specified in the body.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['account_id', 'type', 'amount', 'reference_id'],
                properties: {
                  account_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                  type: { type: 'string', enum: ['credit', 'debit'], example: 'debit' },
                  amount: { type: 'number', format: 'float', example: 50.0 },
                  description: { type: 'string', example: 'Coffee & Books' },
                  reference_id: { type: 'string', example: 'REF-TX-002' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Transaction processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Transaction processed successfully' },
                    data: { $ref: '#/components/schemas/Transaction' },
                    meta: {
                      type: 'object',
                      properties: {
                        current_balance: { type: 'number', example: 350.5 },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error or Insufficient balance', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Duplicate reference_id', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/transfers': {
      post: {
        tags: ['Transfers'],
        summary: 'Peer-to-peer money transfer',
        description: 'Transfers money atomically between two distinct accounts with full rollback on failure.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['source_account_id', 'destination_account_id', 'amount', 'reference_id'],
                properties: {
                  source_account_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                  destination_account_id: { type: 'string', example: 'b9c8d7e6-f5a4-3210-fedc-ba9876543210' },
                  amount: { type: 'number', format: 'float', example: 75.0 },
                  description: { type: 'string', example: 'Shared hotel expense' },
                  reference_id: { type: 'string', example: 'TR-REF-999' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Money transferred successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Money transferred successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        transfer: { $ref: '#/components/schemas/Transfer' },
                        source_account: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            previous_balance: { type: 'number' },
                            new_balance: { type: 'number' },
                          },
                        },
                        destination_account: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            previous_balance: { type: 'number' },
                            new_balance: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Insufficient funds or same-account transfer error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Source or destination account not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Duplicate transfer reference_id', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
  },
};

export const setupSwagger = (app) => {
  // Serve raw JSON spec at /api-docs/swagger.json (must precede swaggerUi.serve)
  app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
  });

  // Serve Swagger UI at /api-docs
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Transaction Ledger API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};

export default { swaggerDocument, setupSwagger };
