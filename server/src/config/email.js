import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: Number(env.EMAIL_PORT) === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

transporter.verify().catch(() => {
  // eslint-disable-next-line no-console
  console.warn(
    '[Email] SMTP connection failed. Emails will not be sent.\n' +
    '  → For Gmail: use an App Password (Google Account → Security → App Passwords)\n' +
    '  → Set EMAIL_USER and EMAIL_PASS in your .env file'
  );
});

export default transporter;
