import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as doctorService from './doctor.service.js';
import ApiError from '../../utils/ApiError.js';

export const searchDoctors = asyncHandler(async (req, res) => {
  const { doctors, pagination } = await doctorService.searchDoctors(req.query);
  res.status(200).json(new ApiResponse(200, doctors, 'Doctors fetched', pagination));
});

export const getDoctorPublicProfile = asyncHandler(async (req, res) => {
  const profile = await doctorService.getDoctorPublicProfile(req.params.id);
  res.status(200).json(new ApiResponse(200, profile));
});

export const getDoctorAvailableSlots = asyncHandler(async (req, res) => {
  const slots = await doctorService.getDoctorAvailableSlots(req.params.id, req.query.date);
  res.status(200).json(new ApiResponse(200, slots));
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await doctorService.getMyProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, profile));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await doctorService.updateMyProfile(req.user._id, req.validated.body);
  res.status(200).json(new ApiResponse(200, profile, 'Profile updated'));
});

export const updateLicenseDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const profile = await doctorService.updateLicenseDocument(req.user._id, req.file.buffer);
  res.status(200).json(new ApiResponse(200, profile, 'License document updated'));
});

export const getMySchedule = asyncHandler(async (req, res) => {
  const schedules = await doctorService.getMySchedule(req.user._id);
  res.status(200).json(new ApiResponse(200, schedules));
});

export const setSchedule = asyncHandler(async (req, res) => {
  const schedules = await doctorService.setSchedule(req.user._id, req.validated.body.schedules);
  res.status(200).json(new ApiResponse(200, schedules, 'Schedule updated'));
});

export const generateSlots = asyncHandler(async (req, res) => {
  const slots = await doctorService.generateSlots(
    req.user._id,
    req.validated.body.startDate,
    req.validated.body.endDate
  );
  res.status(201).json(new ApiResponse(201, slots, `${slots.length} slots generated`));
});

export const getMySlots = asyncHandler(async (req, res) => {
  const slots = await doctorService.getMySlots(req.user._id, req.query.date || new Date().toISOString());
  res.status(200).json(new ApiResponse(200, slots));
});

export const toggleBlockSlot = asyncHandler(async (req, res) => {
  const slot = await doctorService.toggleBlockSlot(req.user._id, req.params.slotId);
  res.status(200).json(new ApiResponse(200, slot, 'Slot updated'));
});

export const getMyAppointments = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await doctorService.getMyAppointments(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, appointments, 'Appointments fetched', pagination));
});

export const acceptAppointment = asyncHandler(async (req, res) => {
  const appointment = await doctorService.acceptAppointment(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, appointment, 'Appointment confirmed'));
});

export const rejectAppointment = asyncHandler(async (req, res) => {
  const appointment = await doctorService.rejectAppointment(
    req.user._id,
    req.params.id,
    req.body.reason
  );
  res.status(200).json(new ApiResponse(200, appointment, 'Appointment rejected'));
});

export const completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await doctorService.completeAppointment(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, appointment, 'Appointment marked complete'));
});

export const getPatientHistory = asyncHandler(async (req, res) => {
  const history = await doctorService.getPatientHistory(req.user._id, req.params.patientId);
  res.status(200).json(new ApiResponse(200, history));
});
