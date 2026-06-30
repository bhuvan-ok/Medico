import User from '../user/user.model.js';
import DoctorProfile from '../doctor/doctorProfile.model.js';
import Appointment from '../appointment/appointment.model.js';
import Slot from '../doctor/slot.model.js';
import Review from '../review/review.model.js';
import ApiError from '../../utils/ApiError.js';
import crypto from 'crypto';
import { sendEmail } from '../../utils/sendEmail.js';
import { doctorVerifiedTemplate, doctorRejectedTemplate, doctorCredentialsTemplate } from '../../utils/emailTemplates.js';
import { createNotification } from '../notification/notification.service.js';
import { buildQueryFilters } from '../../utils/buildQueryFilters.js';

export const createDoctor = async (adminId, { name, email, specialization, licenseNumber, consultationFee, appointmentType, experience, bio }) => {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  const rawPassword = Array.from(bytes, (b) => chars[b % chars.length]).join('');

  const user = await User.create({
    name,
    email,
    password: rawPassword,
    role: 'doctor',
    isEmailVerified: true,
    isActive: true,
  });

  await DoctorProfile.create({
    userId: user._id,
    specialization,
    licenseNumber,
    consultationFee,
    appointmentType: appointmentType || ['in-person'],
    experience: experience || 0,
    bio: bio || '',
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: adminId,
    isAcceptingPatients: true,
  });

  let emailSent = false;
  try {
    const template = doctorCredentialsTemplate(name, email, rawPassword);
    await sendEmail({ to: email, ...template });
    emailSent = true;
  } catch (emailErr) {
    // eslint-disable-next-line no-console
    console.error(`[Admin] Credentials email failed for ${email}:`, emailErr.message);
  }

  return { name: user.name, email: user.email, role: user.role, emailSent };
};

export const getDashboard = async () => {
  const [
    totalUsers,
    totalDoctors,
    pendingVerifications,
    todayAppointments,
    totalAppointments,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    DoctorProfile.countDocuments({ isVerified: true }),
    DoctorProfile.countDocuments({ isVerified: false }),
    Appointment.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Appointment.countDocuments(),
  ]);

  return { totalUsers, totalDoctors, pendingVerifications, todayAppointments, totalAppointments };
};

export const getAllDoctors = async (query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    searchFields: ['specialization'],
    allowedFilters: ['isVerified', 'specialization'],
    defaultSort: { createdAt: -1 },
  });

  const [doctors, total] = await Promise.all([
    DoctorProfile.find(filter)
      .populate('userId', 'name email isActive avatar createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    DoctorProfile.countDocuments(filter),
  ]);

  return { doctors, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const verifyDoctor = async (adminId, doctorUserId, approved, reason) => {
  const profile = await DoctorProfile.findOne({ userId: doctorUserId }).populate('userId', 'name email');
  if (!profile) throw new ApiError(404, 'Doctor profile not found');

  if (approved) {
    profile.isVerified = true;
    profile.verifiedAt = new Date();
    profile.verifiedBy = adminId;
    await profile.save();

    const template = doctorVerifiedTemplate(profile.userId.name);
    sendEmail({ to: profile.userId.email, ...template }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[Email] Doctor verified email failed:', err.message);
    });

    await createNotification({
      userId: doctorUserId,
      type: 'doctor_verified',
      title: 'Account Verified',
      message: 'Your doctor account has been verified. You can now accept appointments.',
      meta: {},
    });
  } else {
    const template = doctorRejectedTemplate(profile.userId.name, reason);
    sendEmail({ to: profile.userId.email, ...template }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[Email] Doctor rejected email failed:', err.message);
    });
  }

  return profile;
};

export const suspendDoctor = async (doctorUserId) => {
  const user = await User.findByIdAndUpdate(doctorUserId, { isActive: false }, { new: true });
  if (!user || user.role !== 'doctor') throw new ApiError(404, 'Doctor not found');
  return user;
};

export const activateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const getAllPatients = async (query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    searchFields: ['name', 'email'],
    allowedFilters: ['isActive'],
    defaultSort: { createdAt: -1 },
  });

  filter.role = 'patient';

  const [patients, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { patients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const suspendPatient = async (patientId) => {
  const user = await User.findOneAndUpdate(
    { _id: patientId, role: 'patient' },
    { isActive: false },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'Patient not found');
  return user;
};

export const getAllAppointments = async (query) => {
  const { filter, sort, skip, limit, page } = buildQueryFilters({
    query,
    allowedFilters: ['status', 'type'],
    defaultSort: { createdAt: -1 },
  });

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .populate('slotId', 'date startTime endTime')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return { appointments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getAnalytics = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [appointmentsByDay, statusDistribution, topDoctors, revenueByDay, newUsersByDay] =
    await Promise.all([
      Appointment.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      DoctorProfile.find({ isVerified: true })
        .populate('userId', 'name avatar')
        .sort({ 'rating.average': -1 })
        .limit(10)
        .select('specialization rating consultationFee'),

      Appointment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$consultationFee' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  return { appointmentsByDay, statusDistribution, topDoctors, revenueByDay, newUsersByDay };
};

export const adminCancelAppointment = async (appointmentId, reason) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name email')
    .populate('slotId', 'date startTime endTime');

  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw new ApiError(400, 'This appointment cannot be cancelled');
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  appointment.cancelledAt = new Date();
  await appointment.save();

  await Slot.findByIdAndUpdate(appointment.slotId._id, { status: 'available', appointmentId: null });

  return appointment;
};

export const removeReview = async (reviewId) => {
  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  const stats = await Review.aggregate([
    { $match: { doctorId: review.doctorId, isVerified: true } },
    { $group: { _id: '$doctorId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await DoctorProfile.findOneAndUpdate(
    { userId: review.doctorId },
    {
      $set: {
        'rating.average': stats.length > 0 ? Math.round(stats[0].average * 10) / 10 : 0,
        'rating.count': stats.length > 0 ? stats[0].count : 0,
      },
    }
  );
};
