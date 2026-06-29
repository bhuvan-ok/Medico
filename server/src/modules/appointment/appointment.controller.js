import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as appointmentService from './appointment.service.js';

export const bookAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment(req.user._id, req.validated.body);
  res.status(201).json(new ApiResponse(201, appointment, 'Appointment booked successfully'));
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointment(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, appointment));
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment(
    req.user._id,
    req.params.id,
    req.validated.body.reason,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, appointment, 'Appointment cancelled'));
});

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.rescheduleAppointment(
    req.user._id,
    req.params.id,
    req.validated.body.newSlotId
  );
  res.status(201).json(new ApiResponse(201, appointment, 'Appointment rescheduled'));
});
