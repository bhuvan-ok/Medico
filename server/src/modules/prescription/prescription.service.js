import Prescription from './prescription.model.js';
import Appointment from '../appointment/appointment.model.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary.js';
import { createNotification } from '../notification/notification.service.js';

export const createPrescription = async (doctorId, appointmentId, body) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId })
    .populate('patientId', 'name');

  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'completed') {
    throw new ApiError(400, 'Prescription can only be written for completed appointments');
  }

  const existing = await Prescription.findOne({ appointmentId });
  if (existing) throw new ApiError(409, 'Prescription already exists for this appointment');

  const prescription = await Prescription.create({
    appointmentId,
    doctorId,
    patientId: appointment.patientId._id,
    ...body,
  });

  await createNotification({
    userId: appointment.patientId._id,
    type: 'prescription_ready',
    title: 'Prescription Available',
    message: 'Your doctor has written a prescription for your recent appointment.',
    meta: { appointmentId, prescriptionId: prescription._id },
  });

  return prescription;
};

export const getPrescription = async (userId, appointmentId) => {
  const prescription = await Prescription.findOne({ appointmentId })
    .populate('doctorId', 'name avatar')
    .populate('patientId', 'name avatar');

  if (!prescription) throw new ApiError(404, 'Prescription not found');

  const isOwner =
    prescription.patientId._id.toString() === userId.toString() ||
    prescription.doctorId._id.toString() === userId.toString();

  if (!isOwner) throw new ApiError(403, 'Access denied');
  return prescription;
};

export const updatePrescription = async (doctorId, appointmentId, body) => {
  const prescription = await Prescription.findOneAndUpdate(
    { appointmentId, doctorId },
    { $set: body },
    { new: true, runValidators: true }
  );
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  return prescription;
};

export const uploadPrescriptionDocument = async (doctorId, appointmentId, fileBuffer) => {
  const prescription = await Prescription.findOne({ appointmentId, doctorId });
  if (!prescription) throw new ApiError(404, 'Prescription not found');

  const result = await uploadToCloudinary(fileBuffer, 'medibook/prescriptions', 'raw');
  prescription.documentUrl = result;
  await prescription.save();
  return prescription;
};

export const getPatientPrescriptions = async (patientId) => {
  return Prescription.find({ patientId })
    .populate('doctorId', 'name avatar')
    .populate('appointmentId', 'createdAt type')
    .sort({ createdAt: -1 });
};
