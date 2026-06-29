import User from '../modules/user/user.model.js';
import { env } from '../config/env.js';

export const seedAdmin = async () => {
  const existing = await User.findOne({ email: env.ADMIN_EMAIL });
  if (existing) return;

  await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: 'admin',
    isEmailVerified: true,
  });

  // eslint-disable-next-line no-console
  console.log(`Admin seeded: ${env.ADMIN_EMAIL}`);
};
