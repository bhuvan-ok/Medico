import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as prescriptionService from './prescription.service.js';
import ApiError from '../../utils/ApiError.js';

export const createPrescription = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.createPrescription(
    req.user._id,
    req.validated.params.appointmentId,
    req.validated.body
  );
  res.status(201).json(new ApiResponse(201, prescription, 'Prescription created'));
});

export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.getPrescription(req.user._id, req.params.appointmentId);
  res.status(200).json(new ApiResponse(200, prescription));
});

export const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.updatePrescription(
    req.user._id,
    req.validated.params.appointmentId,
    req.validated.body
  );
  res.status(200).json(new ApiResponse(200, prescription, 'Prescription updated'));
});

export const uploadPrescriptionDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const prescription = await prescriptionService.uploadPrescriptionDocument(
    req.user._id,
    req.params.appointmentId,
    req.file.buffer
  );
  res.status(200).json(new ApiResponse(200, prescription, 'Document uploaded'));
});
