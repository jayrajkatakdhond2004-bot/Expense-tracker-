const os = require('os');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../src/app');
const { ensureDefaultCategories } = require('../src/services/category.service');

let mongo;
const app = createApp();

async function setupDB() {
  mongo = await MongoMemoryServer.create();
  // The MongoDB driver loads its `os` adapter with a dynamic import(), which Jest's
  // CommonJS sandbox does not support, so the adapter is injected explicitly.
  await mongoose.connect(mongo.getUri(), { runtimeAdapters: { os } });
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

async function resetDB() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  await ensureDefaultCategories();
}

async function teardownDB() {
  await mongoose.disconnect();
  await mongo?.stop();
}

let counter = 0;
/** Registers a fresh user and returns an agent that keeps the auth cookie. */
async function createUserAgent(overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const user = {
    name: 'Test User',
    email: `user${counter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await agent.post('/api/v1/auth/register').send(user).expect(201);
  return { agent, user: res.body.data.user, credentials: user };
}

async function getCategoryId(agent, name) {
  const res = await agent.get('/api/v1/categories').expect(200);
  return res.body.data.find((c) => c.name === name)._id;
}

module.exports = { app, setupDB, resetDB, teardownDB, createUserAgent, getCategoryId };
