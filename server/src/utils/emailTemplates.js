import { env } from '../config/env.js';

const baseStyle = `font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;`;
const cardStyle = `background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;`;
const btnStyle = `display: inline-block; background: #0EA5E9; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;`;

export const emailVerificationTemplate = (name, token) => ({
  subject: 'Verify your MediBook email',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#0EA5E9;">Welcome to MediBook, ${name}!</h2>
    <p>Please verify your email address to get started.</p>
    <a href="${env.CLIENT_URL}/verify-email/${token}" style="${btnStyle}">Verify Email</a>
    <p style="color:#64748b;font-size:14px;margin-top:24px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
  </div></div>`,
});

export const passwordResetTemplate = (name, token) => ({
  subject: 'Reset your MediBook password',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#0EA5E9;">Password Reset Request</h2>
    <p>Hi ${name}, click below to reset your password.</p>
    <a href="${env.CLIENT_URL}/reset-password/${token}" style="${btnStyle}">Reset Password</a>
    <p style="color:#64748b;font-size:14px;margin-top:24px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  </div></div>`,
});

export const appointmentBookedTemplate = (patientName, doctorName, date, time, type) => ({
  subject: 'Appointment Booked — MediBook',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#0EA5E9;">Appointment Confirmed</h2>
    <p>Hi ${patientName}, your appointment has been booked.</p>
    <table style="width:100%;margin-top:16px;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;">Doctor</td><td><strong>Dr. ${doctorName}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Date</td><td><strong>${date}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Time</td><td><strong>${time}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Type</td><td><strong>${type}</strong></td></tr>
    </table>
    <p style="color:#64748b;font-size:14px;margin-top:24px;">You will receive a reminder 24 hours before your appointment.</p>
  </div></div>`,
});

export const appointmentConfirmedTemplate = (patientName, doctorName, date, time) => ({
  subject: 'Appointment Confirmed by Doctor — MediBook',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#10B981;">Appointment Confirmed!</h2>
    <p>Hi ${patientName}, Dr. ${doctorName} has confirmed your appointment on <strong>${date} at ${time}</strong>.</p>
  </div></div>`,
});

export const appointmentRejectedTemplate = (patientName, doctorName, date, time, reason) => ({
  subject: 'Appointment Rejected — MediBook',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#EF4444;">Appointment Rejected</h2>
    <p>Hi ${patientName}, Dr. ${doctorName} has rejected your appointment on <strong>${date} at ${time}</strong>.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Please book another available slot.</p>
  </div></div>`,
});

export const appointmentCancelledTemplate = (recipientName, patientName, doctorName, date, time, cancelledBy) => ({
  subject: 'Appointment Cancelled — MediBook',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#EF4444;">Appointment Cancelled</h2>
    <p>Hi ${recipientName}, the appointment between <strong>${patientName}</strong> and <strong>Dr. ${doctorName}</strong> on <strong>${date} at ${time}</strong> has been cancelled by ${cancelledBy}.</p>
  </div></div>`,
});

export const appointmentReminderTemplate = (name, doctorName, date, time, type) => ({
  subject: 'Appointment Reminder — Tomorrow — MediBook',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#F59E0B;">Upcoming Appointment Reminder</h2>
    <p>Hi ${name}, this is a reminder for your appointment tomorrow.</p>
    <table style="width:100%;margin-top:16px;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;">Doctor</td><td><strong>Dr. ${doctorName}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Date</td><td><strong>${date}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Time</td><td><strong>${time}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Type</td><td><strong>${type}</strong></td></tr>
    </table>
  </div></div>`,
});

export const doctorVerifiedTemplate = (name) => ({
  subject: 'Your MediBook Doctor Account is Verified!',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#10B981;">Account Verified!</h2>
    <p>Hi Dr. ${name}, your account has been verified by our team. You can now accept patient appointments.</p>
    <a href="${env.CLIENT_URL}/doctor/dashboard" style="${btnStyle}">Go to Dashboard</a>
  </div></div>`,
});

export const doctorCredentialsTemplate = (name, email, password) => ({
  subject: 'Your MediBook Doctor Account — Login Credentials',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#0EA5E9;">Welcome to MediBook, Dr. ${name}!</h2>
    <p>Your doctor account has been created and verified by our admin team. You can start accepting appointments right away.</p>
    <table style="width:100%;margin-top:16px;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#64748b;width:90px;">Email</td><td style="font-weight:600;">${email}</td></tr>
    </table>
    <p style="margin:16px 0 6px;color:#64748b;font-size:13px;">Your temporary password:</p>
    <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;font-family:monospace;font-size:20px;letter-spacing:3px;text-align:center;color:#0f172a;">${password}</div>
    <a href="${env.CLIENT_URL}/login" style="${btnStyle}">Login to Dashboard</a>
    <p style="color:#EF4444;font-size:13px;margin-top:20px;"><strong>Important:</strong> Please change your password immediately after your first login.</p>
  </div></div>`,
});

export const doctorRejectedTemplate = (name, reason) => ({
  subject: 'MediBook Doctor Application Update',
  html: `<div style="${baseStyle}"><div style="${cardStyle}">
    <h2 style="color:#EF4444;">Application Not Approved</h2>
    <p>Hi Dr. ${name}, unfortunately your doctor application was not approved.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Please contact support if you believe this is an error.</p>
  </div></div>`,
});
