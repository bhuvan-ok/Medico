import transporter from '../config/email.js';
import { env } from '../config/env.js';

// Gmail SMTP requires the FROM address to match the authenticated user.
// Using EMAIL_USER directly prevents Gmail from silently overriding/rejecting
// a mismatched From header, which causes emails to be dropped or spam-flagged.
export const sendEmail = async ({ to, subject, html }) => {
  const send = transporter.sendMail({
    from: env.EMAIL_FROM || `MediBook <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('SMTP timeout after 12 s')), 12000)
  );

  await Promise.race([send, timeout]);
};
