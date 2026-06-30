import { createServer } from 'http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { initSocket } from './socket/index.js';
import { initCronJobs } from './utils/cronJobs.js';
import { seedAdmin } from './utils/seedAdmin.js';

const start = async () => {
  const host = await connectDB();
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${host}`);

  await seedAdmin();
  initCronJobs();

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
