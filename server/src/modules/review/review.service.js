import Review from './review.model.js';
import Appointment from '../appointment/appointment.model.js';
import ApiError from '../../utils/ApiError.js';
import { createNotification } from '../notification/notification.service.js';
import { buildQueryFilters } from '../../utils/buildQueryFilters.js';

export const addReview = async (patientId, appointmentId, { rating, comment }) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, patientId });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'completed') {
    throw new ApiError(400, 'You can only review completed appointments');
  }

  const existing = await Review.findOne({ appointmentId });
  if (existing) throw new ApiError(409, 'You have already reviewed this appointment');

  const review = await Review.create({
    appointmentId,
    patientId,
    doctorId: appointment.doctorId,
    rating,
    comment,
  });

  await createNotification({
    userId: appointment.doctorId,
    type: 'review_received',
    title: 'New Review',
    message: `A patient left you a ${rating}-star review.`,
    meta: { reviewId: review._id },
  });

  return review;
};

export const getDoctorReviews = async (doctorId, query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    allowedSortFields: ['rating', 'createdAt'],
    defaultSort: { createdAt: -1 },
  });

  filter.doctorId = doctorId;
  filter.isVerified = true;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .select('-patientId')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
