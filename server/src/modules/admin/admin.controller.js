import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as adminService from './admin.service.js';

export const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await adminService.createDoctor(req.user._id, req.validated.body);
  res.status(201).json(new ApiResponse(201, doctor, 'Doctor created and credentials sent'));
});

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await adminService.getDashboard();
  res.status(200).json(new ApiResponse(200, data));
});

export const getAllDoctors = asyncHandler(async (req, res) => {
  const { doctors, pagination } = await adminService.getAllDoctors(req.query);
  res.status(200).json(new ApiResponse(200, doctors, 'Doctors fetched', pagination));
});

export const verifyDoctor = asyncHandler(async (req, res) => {
  const { approved, reason } = req.body;
  const profile = await adminService.verifyDoctor(req.user._id, req.params.id, approved, reason);
  res.status(200).json(new ApiResponse(200, profile, approved ? 'Doctor verified' : 'Doctor rejected'));
});

export const suspendDoctor = asyncHandler(async (req, res) => {
  const user = await adminService.suspendDoctor(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'Doctor suspended'));
});

export const activateUser = asyncHandler(async (req, res) => {
  const user = await adminService.activateUser(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'User activated'));
});

export const getAllPatients = asyncHandler(async (req, res) => {
  const { patients, pagination } = await adminService.getAllPatients(req.query);
  res.status(200).json(new ApiResponse(200, patients, 'Patients fetched', pagination));
});

export const suspendPatient = asyncHandler(async (req, res) => {
  const user = await adminService.suspendPatient(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'Patient suspended'));
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await adminService.getAllAppointments(req.query);
  res.status(200).json(new ApiResponse(200, appointments, 'Appointments fetched', pagination));
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await adminService.adminCancelAppointment(req.params.id, req.body.reason);
  res.status(200).json(new ApiResponse(200, appointment, 'Appointment cancelled'));
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const data = await adminService.getAnalytics();
  res.status(200).json(new ApiResponse(200, data));
});

export const removeReview = asyncHandler(async (req, res) => {
  await adminService.removeReview(req.params.reviewId);
  res.status(200).json(new ApiResponse(200, null, 'Review removed'));
});
