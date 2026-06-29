import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { initCronJobs } from './utils/cronJobs.js';
import { seedAdmin } from './utils/seedAdmin.js';

const start = async () => {
  const host = await connectDB();
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${host}`);

  await seedAdmin();
  initCronJobs();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
