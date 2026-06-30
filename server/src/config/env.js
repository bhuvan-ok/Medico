import dotenv from 'dotenv';
dotenv.config();

const _required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGODB_URI: _required('MONGODB_URI'),

  ACCESS_TOKEN_SECRET: _required('ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: _required('REFRESH_TOKEN_SECRET'),
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  CLOUDINARY_CLOUD_NAME: _required('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: _required('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: _required('CLOUDINARY_API_SECRET'),

  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 465,
  EMAIL_USER: _required('EMAIL_USER'),
  EMAIL_PASS: _required('EMAIL_PASS'),
  EMAIL_FROM: process.env.EMAIL_FROM || 'MediBook <no-reply@medibook.com>',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@medibook.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123456',

  RAZORPAY_KEY_ID: _required('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: _required('RAZORPAY_KEY_SECRET'),

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
