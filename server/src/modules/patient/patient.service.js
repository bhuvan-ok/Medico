import MedicalReport from './medicalReport.model.js';
import Appointment from '../appointment/appointment.model.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary.js';
import { deleteFromCloudinary } from '../../utils/deleteFromCloudinary.js';
import { buildQueryFilters } from '../../utils/buildQueryFilters.js';

export const uploadReport = async (patientId, { title, reportType }, fileBuffer) => {
  const result = await uploadToCloudinary(fileBuffer, 'medibook/reports', 'raw');
  return MedicalReport.create({ patientId, title, reportType, fileUrl: result });
};

export const getMyReports = async (patientId, query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    allowedFilters: ['reportType'],
    defaultSort: { createdAt: -1 },
  });

  filter.patientId = patientId;
  const [reports, total] = await Promise.all([
    MedicalReport.find(filter).sort(sort).skip(skip).limit(limit),
    MedicalReport.countDocuments(filter),
  ]);

  return { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getReport = async (patientId, reportId) => {
  const report = await MedicalReport.findOne({ _id: reportId, patientId });
  if (!report) throw new ApiError(404, 'Report not found');
  return report;
};

export const deleteReport = async (patientId, reportId) => {
  const report = await MedicalReport.findOne({ _id: reportId, patientId });
  if (!report) throw new ApiError(404, 'Report not found');
  await deleteFromCloudinary(report.fileUrl.publicId, 'raw');
  await report.deleteOne();
};

export const getMyAppointments = async (patientId, query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    allowedFilters: ['status', 'type'],
    defaultSort: { createdAt: -1 },
  });

  filter.patientId = patientId;
  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('doctorId', 'name email avatar')
      .populate('slotId', 'date startTime endTime')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return { appointments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
