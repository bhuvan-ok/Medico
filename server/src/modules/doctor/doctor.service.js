import DoctorProfile from './doctorProfile.model.js';
import DoctorSchedule from './doctorSchedule.model.js';
import Slot from './slot.model.js';
import Appointment from '../appointment/appointment.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary.js';
import { deleteFromCloudinary } from '../../utils/deleteFromCloudinary.js';
import { buildQueryFilters } from '../../utils/buildQueryFilters.js';
import { getAvailableSlots, generateSlotsForRange, blockSlot } from './slot.service.js';

export const getMyProfile = async (userId) => {
  const profile = await DoctorProfile.findOne({ userId }).populate('userId', 'name email avatar phone');
  if (!profile) throw new ApiError(404, 'Doctor profile not found');
  return profile;
};

export const updateMyProfile = async (userId, body) => {
  const profile = await DoctorProfile.findOneAndUpdate(
    { userId },
    { $set: body },
    { new: true, runValidators: true }
  );
  if (!profile) throw new ApiError(404, 'Doctor profile not found');
  return profile;
};

export const updateLicenseDocument = async (userId, fileBuffer) => {
  const profile = await DoctorProfile.findOne({ userId });
  if (!profile) throw new ApiError(404, 'Doctor profile not found');

  if (profile.licenseDocument?.publicId) {
    await deleteFromCloudinary(profile.licenseDocument.publicId, 'raw');
  }

  const result = await uploadToCloudinary(fileBuffer, 'medibook/licenses', 'raw');
  profile.licenseDocument = result;
  await profile.save();
  return profile;
};

export const getMySchedule = async (userId) => {
  return DoctorSchedule.find({ doctorId: userId }).sort({ dayOfWeek: 1 });
};

export const setSchedule = async (userId, schedules) => {
  const ops = schedules.map((s) => ({
    updateOne: {
      filter: { doctorId: userId, dayOfWeek: s.dayOfWeek },
      update: { $set: { ...s, doctorId: userId } },
      upsert: true,
    },
  }));
  await DoctorSchedule.bulkWrite(ops);
  return DoctorSchedule.find({ doctorId: userId }).sort({ dayOfWeek: 1 });
};

export const generateSlots = async (userId, startDate, endDate) => {
  return generateSlotsForRange(userId, startDate, endDate);
};

export const getMySlots = async (userId, dateStr) => {
  return getAvailableSlots(userId, dateStr);
};

export const toggleBlockSlot = async (userId, slotId) => {
  return blockSlot(userId, slotId);
};

export const getMyAppointments = async (userId, query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    allowedFilters: ['status'],
    allowedSortFields: ['createdAt'],
  });

  filter.doctorId = userId;
  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'name email avatar')
      .populate('slotId', 'date startTime endTime')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return {
    appointments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const acceptAppointment = async (doctorId, appointmentId) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'pending') throw new ApiError(400, 'Only pending appointments can be confirmed');

  appointment.status = 'confirmed';
  appointment.confirmedAt = new Date();
  await appointment.save();
  return appointment;
};

export const rejectAppointment = async (doctorId, appointmentId, reason) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'pending') throw new ApiError(400, 'Only pending appointments can be rejected');

  appointment.status = 'rejected';
  appointment.cancellationReason = reason;
  await appointment.save();

  // Release the slot
  await Slot.findByIdAndUpdate(appointment.slotId, { status: 'available', appointmentId: null });

  return appointment;
};

export const completeAppointment = async (doctorId, appointmentId) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'confirmed') throw new ApiError(400, 'Only confirmed appointments can be completed');

  appointment.status = 'completed';
  appointment.completedAt = new Date();
  await appointment.save();

  await Slot.findByIdAndUpdate(appointment.slotId, { status: 'completed' });

  return appointment;
};

export const getPatientHistory = async (doctorId, patientId) => {
  return Appointment.find({ doctorId, patientId })
    .populate('slotId', 'date startTime endTime')
    .sort({ createdAt: -1 });
};

// Public endpoints
export const searchDoctors = async (query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    allowedFilters: ['specialization', 'appointmentType'],
    allowedSortFields: ['rating.average', 'consultationFee', 'experience', 'createdAt'],
    defaultSort: { createdAt: -1 }, // newest doctors appear first by default
  });

  filter.isVerified = true;
  filter.isAcceptingPatients = true;

  if (query.language) filter.languages = query.language;
  if (query.appointmentType) filter.appointmentType = query.appointmentType;

  // Use aggregation so we can search by doctor name (in User) as well as specialization
  const searchRegex = query.search ? new RegExp(query.search, 'i') : null;

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId',
        pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
      },
    },
    { $unwind: '$userId' },
    ...(searchRegex
      ? [{ $match: { $or: [{ specialization: searchRegex }, { 'userId.name': searchRegex }] } }]
      : []),
    {
      $facet: {
        data: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await DoctorProfile.aggregate(pipeline);
  const doctors = result?.data ?? [];
  const total = result?.total[0]?.count ?? 0;

  return { doctors, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getDoctorPublicProfile = async (doctorId) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId }).populate(
    'userId',
    'name email avatar'
  );
  if (!profile || !profile.isVerified) throw new ApiError(404, 'Doctor not found');
  return profile;
};

export const getDoctorAvailableSlots = async (doctorId, dateStr) => {
  return getAvailableSlots(doctorId, dateStr);
};
