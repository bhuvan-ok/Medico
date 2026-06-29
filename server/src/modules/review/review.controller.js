import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as reviewService from './review.service.js';

export const addReview = asyncHandler(async (req, res) => {
  const review = await reviewService.addReview(req.user._id, req.params.id, req.validated.body);
  res.status(201).json(new ApiResponse(201, review, 'Review submitted'));
});

export const getDoctorReviews = asyncHandler(async (req, res) => {
  const { reviews, pagination } = await reviewService.getDoctorReviews(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, reviews, 'Reviews fetched', pagination));
});
