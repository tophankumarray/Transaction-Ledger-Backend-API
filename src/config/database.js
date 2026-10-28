const mongoose = require('mongoose');
const env = require('./env');

let mongoMemoryServerInstance = null;
let supportsTransactions = false;

/**
 * Connect to MongoDB.
 * Connects to the provided URI, or spins up an in-memory instance if specified or as fallback.
 */
const connectDB = async () => {
  try {
    let mongoUri = env.MONGODB_URI;

    if (env.USE_IN_MEMORY_DB) {
      console.log('[Database] USE_IN_MEMORY_DB is true. Starting in-memory MongoDB ReplicaSet...');
      const { MongoMemoryReplSet } = require('mongodb-memory-server');
      mongoMemoryServerInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      mongoUri = mongoMemoryServerInstance.getUri();
      console.log(`[Database] In-memory MongoDB ReplicaSet started at ${mongoUri}`);
    }

    // Set connection options
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] Connected successfully to MongoDB at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

    // Detect if the deployment supports multi-document ACID transactions (Replica Set or Sharded)
    try {
      const isReplSet = mongoose.connection.client.topology?.description?.type !== 'Single' &&
                        mongoose.connection.client.topology?.description?.type !== 'Unknown';
      supportsTransactions = isReplSet;
      console.log(`[Database] ACID Transactions supported: ${supportsTransactions} (Topology: ${mongoose.connection.client.topology?.description?.type})`);
    } catch (e) {
      supportsTransactions = false;
    }

    return mongoose.connection;
  } catch (error) {
    // If standard connection fails and in dev mode, gracefully offer in-memory fallback
    if (!env.USE_IN_MEMORY_DB && env.NODE_ENV === 'development') {
      console.warn('[Database] Local MongoDB unreachable. Falling back to in-memory MongoDB ReplicaSet for development...');
      try {
        const { MongoMemoryReplSet } = require('mongodb-memory-server');
        mongoMemoryServerInstance = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' },
        });
        const mongoUri = mongoMemoryServerInstance.getUri();
        await mongoose.connect(mongoUri);
        supportsTransactions = true;
        console.log(`[Database] Connected to fallback in-memory MongoDB at ${mongoUri}`);
        return mongoose.connection;
      } catch (inMemErr) {
        console.error('[Database] Failed to start in-memory fallback:', inMemErr.message);
        throw error;
      }
    }
    console.error('[Database] MongoDB connection failed:', error.message);
    throw error;
  }
};

/**
 * Disconnect and clean up MongoDB connections.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    console.log('[Database] Disconnected from MongoDB');
  } catch (error) {
    console.error('[Database] Error disconnecting from MongoDB:', error.message);
  }
};

/**
 * Executes a callback inside a MongoDB transaction if supported,
 * or directly if standalone instance.
 *
 * @param {Function} callback - async (session) => result
 */
const runInTransaction = async (callback) => {
  if (supportsTransactions) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } else {
    // Standalone fallback: execute without session
    return await callback(null);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  runInTransaction,
  isTransactionsSupported: () => supportsTransactions,
};

