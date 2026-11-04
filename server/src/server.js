const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { ensureDefaultCategories } = require('./services/category.service');
const createApp = require('./app');

async function start() {
  await connectDB();
  await ensureDefaultCategories();
  console.log('MongoDB connected');

  const server = createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
