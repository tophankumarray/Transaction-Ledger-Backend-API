const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const env = require('./config/env');

let server = null;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(` Ledger API Server running in [${env.NODE_ENV}] mode`);
      console.log(` Listening on: http://localhost:${env.PORT}`);
      console.log(` Health check: http://localhost:${env.PORT}/api/v1/health`);
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

// Start server only if executed directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
