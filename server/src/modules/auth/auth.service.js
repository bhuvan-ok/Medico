import crypto from 'crypto';
import User from '../user/user.model.js';
import DoctorProfile from '../doctor/doctorProfile.model.js';
import ApiError from '../../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateTokens.js';
import { hashToken, generateRawToken } from '../../utils/hashToken.js';
import { sendEmail } from '../../utils/sendEmail.js';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
} from '../../utils/emailTemplates.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const issueTokens = async (user) => {
  const payload = { _id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const register = async (body) => {
  const { name, email, password, role, phone, specialization, licenseNumber } = body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  if (role === 'doctor' && (!specialization || !licenseNumber)) {
    throw new ApiError(400, 'Doctors must provide specialization and license number');
  }

  const user = await User.create({ name, email, password, role, phone });

  if (role === 'doctor') {
    await DoctorProfile.create({
      userId: user._id,
      specialization,
      licenseNumber,
    });
  }

  const rawToken = generateRawToken();
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const template = emailVerificationTemplate(name, rawToken);
  await sendEmail({ to: email, ...template });

  return { _id: user._id, name: user.name, email: user.email, role: user.role };
};

export const verifyEmail = async (token) => {
  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpiry: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpiry');

  if (!user) throw new ApiError(400, 'Invalid or expired verification link');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });
};

export const resendVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isEmailVerified) throw new ApiError(400, 'Email already verified');

  const rawToken = generateRawToken();
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const template = emailVerificationTemplate(user.name, rawToken);
  await sendEmail({ to: user.email, ...template });
};

export const login = async (email, password, res) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +refreshToken');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account suspended. Contact support.');

  const isMatch = await user.isPasswordCorrect(password.trim());
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  user.lastLogin = new Date();
  const { accessToken, refreshToken } = await issueTokens(user);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return {
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
    },
  };
};

export const refresh = async (incomingToken, res) => {
  if (!incomingToken) throw new ApiError(401, 'Refresh token missing');

  let decoded;
  try {
    const jwt = await import('jsonwebtoken');
    decoded = jwt.default.verify(incomingToken, env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded._id).select('+refreshToken');
  if (!user || user.refreshToken !== hashToken(incomingToken)) {
    throw new ApiError(401, 'Refresh token reuse detected');
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  return { accessToken };
};

export const logout = async (userId, res) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  res.clearCookie('refreshToken', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict' });
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Always respond OK to prevent email enumeration
  if (!user) return;

  const rawToken = generateRawToken();
  user.passwordResetToken = hashToken(rawToken);
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const template = passwordResetTemplate(user.name, rawToken);
  await sendEmail({ to: user.email, ...template });
};

export const findOrCreateGoogleUser = async (profile) => {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new ApiError(400, 'Google account has no email address');

  let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] }).select('+googleId');

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      googleId: profile.id,
      role: 'patient',
      isEmailVerified: true,
      isActive: true,
      avatar: { url: profile.photos?.[0]?.value || '', publicId: '' },
    });
  } else {
    if (!user.googleId) {
      user.googleId = profile.id;
      if (!user.avatar?.url && profile.photos?.[0]?.value) {
        user.avatar = { url: profile.photos[0].value, publicId: '' };
      }
      await user.save({ validateBeforeSave: false });
    }
    if (!user.isActive) throw new ApiError(403, 'Account suspended. Contact support.');
  }

  return user;
};

export const completeOAuthLogin = async (user, res) => {
  user.lastLogin = new Date();
  const { accessToken, refreshToken } = await issueTokens(user);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  return { accessToken };
};

export const resetPassword = async (token, newPassword) => {
  const hashed = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpiry');

  if (!user) throw new ApiError(400, 'Invalid or expired reset link');

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshToken = undefined;
  await user.save();
};
