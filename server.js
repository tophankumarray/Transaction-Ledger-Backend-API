import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import { connectDB, disconnectDB } from './config/database.js';
import { setupSwagger } from './config/swagger.js';
import env from './config/env.js';

// Express Application Setup
const app = express();

// Security Middlewares (disable default CSP so Swagger UI loads its assets)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// HTTP Request Logging (disable in test environment)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Body Parsing Middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Swagger UI Documentation
setupSwagger(app);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Transaction Ledger Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      docs: '/api-docs',
      auth: '/api/v1/auth',
      accounts: '/api/v1/accounts',
      transactions: '/api/v1/transactions',
      transfers: '/api/v1/transfers',
    },
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Server Lifecycle Management
let server = null;

export const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(` Ledger API Server running in [${env.NODE_ENV}] mode`);
      console.log(` Listening on: http://localhost:${env.PORT}`);
      console.log(` Swagger Docs: http://localhost:${env.PORT}/api-docs`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      console.log('Database connection closed. Exiting process.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Start server if executed directly
const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (executedFilePath && currentFilePath === executedFilePath) {
  startServer();
}

export { app };
export default { app, startServer };
