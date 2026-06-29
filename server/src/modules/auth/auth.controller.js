import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';
import passport from '../../config/passport.js';
import { env } from '../../config/env.js';

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.validated.body);
  res.status(201).json(new ApiResponse(201, data, 'Registration successful. Please verify your email.'));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.status(200).json(new ApiResponse(200, null, 'Email verified successfully'));
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Verification email sent'));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const data = await authService.login(email, password, res);
  res.status(200).json(new ApiResponse(200, data, 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.cookies?.refreshToken, res);
  res.status(200).json(new ApiResponse(200, data, 'Token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, res);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.validated.body.email);
  res.status(200).json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.validated.params.token, req.validated.body.password);
  res.status(200).json(new ApiResponse(200, null, 'Password reset successful'));
});

export const googleRedirect = (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }
    try {
      const { accessToken } = await authService.completeOAuthLogin(user, res);
      res.redirect(`${env.CLIENT_URL}/oauth-callback?token=${encodeURIComponent(accessToken)}`);
    } catch (error) {
      res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(error.message)}`);
    }
  })(req, res, next);
};
