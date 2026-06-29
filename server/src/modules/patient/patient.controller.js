import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import * as patientService from './patient.service.js';
import { getPatientPrescriptions } from '../prescription/prescription.service.js';

export const uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const report = await patientService.uploadReport(
    req.user._id,
    req.validated.body,
    req.file.buffer
  );
  res.status(201).json(new ApiResponse(201, report, 'Report uploaded'));
});

export const getMyReports = asyncHandler(async (req, res) => {
  const { reports, pagination } = await patientService.getMyReports(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, reports, 'Reports fetched', pagination));
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await patientService.getReport(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, report));
});

export const deleteReport = asyncHandler(async (req, res) => {
  await patientService.deleteReport(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Report deleted'));
});

export const getMyAppointments = asyncHandler(async (req, res) => {
  const { appointments, pagination } = await patientService.getMyAppointments(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, appointments, 'Appointments fetched', pagination));
});

export const getMyPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await getPatientPrescriptions(req.user._id);
  res.status(200).json(new ApiResponse(200, prescriptions));
});
