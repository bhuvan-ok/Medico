import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import * as userService from './user.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user._id);
  res.status(200).json(new ApiResponse(200, user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.validated.body);
  res.status(200).json(new ApiResponse(200, user, 'Profile updated'));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const user = await userService.updateAvatar(req.user._id, req.file.buffer);
  res.status(200).json(new ApiResponse(200, user, 'Avatar updated'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  await userService.changePassword(req.user._id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});
