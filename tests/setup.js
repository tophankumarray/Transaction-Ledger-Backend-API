const mongoose = require('mongoose');
const { MongoMemoryReplSet, MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  try {
    // Attempt to start in-memory replica set to test ACID transactions
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
  } catch (err) {
    console.warn('Failed to start MongoMemoryReplSet, falling back to standalone MongoMemoryServer:', err.message);
    mongoServer = await MongoMemoryServer.create();
  }

  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between test cases for clean isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

