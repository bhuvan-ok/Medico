import mongoose from 'mongoose';
import Appointment from './appointment.model.js';
import Slot from '../doctor/slot.model.js';
import DoctorProfile from '../doctor/doctorProfile.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { sendEmail } from '../../utils/sendEmail.js';
import {
  appointmentBookedTemplate,
  appointmentCancelledTemplate,
} from '../../utils/emailTemplates.js';
import { createNotification } from '../notification/notification.service.js';

export const bookAppointment = async (patientId, { slotId, doctorId, type, notes }, paymentData = null) => {
  const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
  if (!doctorProfile) throw new ApiError(404, 'Doctor not found');
  if (!doctorProfile.isVerified) throw new ApiError(400, 'Doctor is not verified');
  if (!doctorProfile.isAcceptingPatients) throw new ApiError(400, 'Doctor is not accepting patients');
  if (!doctorProfile.appointmentType.includes(type)) {
    throw new ApiError(400, `Doctor does not offer ${type} appointments`);
  }

  const session = await mongoose.startSession();
  let appointment;

  try {
    await session.withTransaction(async () => {
      const slot = await Slot.findOneAndUpdate(
        { _id: slotId, doctorId, status: 'available' },
        { $set: { status: 'booked' } },
        { session, new: true }
      );
      if (!slot) throw new ApiError(409, 'Slot is no longer available');

      [appointment] = await Appointment.create(
        [
          {
            patientId,
            doctorId,
            slotId,
            type,
            notes,
            status: 'pending',
            consultationFee: doctorProfile.consultationFee,
            ...(type === 'video' && { videoRoomId: new mongoose.Types.ObjectId().toString() }),
            ...(paymentData && {
              payment: { orderId: paymentData.orderId, paymentId: paymentData.paymentId, status: 'paid' },
            }),
          },
        ],
        { session }
      );

      await Slot.findByIdAndUpdate(slotId, { appointmentId: appointment._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  const [patient, doctor, slot] = await Promise.all([
    User.findById(patientId).select('name email'),
    User.findById(doctorId).select('name email'),
    Slot.findById(slotId),
  ]);

  const dateStr = slot.date.toDateString();
  const template = appointmentBookedTemplate(patient.name, doctor.name, dateStr, slot.startTime, type);
  await sendEmail({ to: patient.email, ...template });

  await createNotification({
    userId: patientId,
    type: 'appointment_booked',
    title: 'Appointment Booked',
    message: `Your appointment with Dr. ${doctor.name} on ${dateStr} at ${slot.startTime} is pending confirmation.`,
    meta: { appointmentId: appointment._id, doctorId },
  });

  await createNotification({
    userId: doctorId,
    type: 'appointment_booked',
    title: 'New Appointment Request',
    message: `${patient.name} has booked an appointment on ${dateStr} at ${slot.startTime}.`,
    meta: { appointmentId: appointment._id, patientId },
  });

  return appointment;
};

export const getAppointment = async (userId, appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId', 'name email avatar')
    .populate('doctorId', 'name email avatar')
    .populate('slotId', 'date startTime endTime');

  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const isOwner =
    appointment.patientId._id.toString() === userId.toString() ||
    appointment.doctorId._id.toString() === userId.toString();
  if (!isOwner) throw new ApiError(403, 'Access denied');

  return appointment;
};

export const cancelAppointment = async (userId, appointmentId, reason, userRole) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name email')
    .populate('slotId', 'date startTime endTime');

  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const isPatient = appointment.patientId._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isPatient && !isAdmin) throw new ApiError(403, 'Not authorised to cancel this appointment');

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw new ApiError(400, 'This appointment cannot be cancelled');
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  appointment.cancelledAt = new Date();
  await appointment.save();

  await Slot.findByIdAndUpdate(appointment.slotId._id, { status: 'available', appointmentId: null });

  const { patientId, doctorId, slotId } = appointment;
  const dateStr = slotId.date.toDateString();
  const cancelledBy = isAdmin ? 'Admin' : 'the patient';

  await sendEmail({
    to: patientId.email,
    ...appointmentCancelledTemplate(patientId.name, patientId.name, doctorId.name, dateStr, slotId.startTime, cancelledBy),
  });
  await sendEmail({
    to: doctorId.email,
    ...appointmentCancelledTemplate(doctorId.name, patientId.name, doctorId.name, dateStr, slotId.startTime, cancelledBy),
  });

  await createNotification({
    userId: patientId._id,
    type: 'appointment_cancelled',
    title: 'Appointment Cancelled',
    message: `Your appointment on ${dateStr} at ${slotId.startTime} has been cancelled.`,
    meta: { appointmentId },
  });

  return appointment;
};

export const rescheduleAppointment = async (patientId, appointmentId, newSlotId) => {
  const oldAppointment = await Appointment.findOne({ _id: appointmentId, patientId })
    .populate('slotId', 'date startTime endTime doctorId')
    .populate('doctorId', 'name');

  if (!oldAppointment) throw new ApiError(404, 'Appointment not found');
  if (!['pending', 'confirmed'].includes(oldAppointment.status)) {
    throw new ApiError(400, 'This appointment cannot be rescheduled');
  }

  const session = await mongoose.startSession();
  let newAppointment;

  try {
    await session.withTransaction(async () => {
      // Book the new slot atomically
      const newSlot = await Slot.findOneAndUpdate(
        { _id: newSlotId, doctorId: oldAppointment.doctorId._id, status: 'available' },
        { $set: { status: 'booked' } },
        { session, new: true }
      );
      if (!newSlot) throw new ApiError(409, 'New slot is not available');

      // Cancel old appointment + release old slot
      oldAppointment.status = 'rescheduled';
      oldAppointment.cancelledAt = new Date();
      await oldAppointment.save({ session });
      await Slot.findByIdAndUpdate(oldAppointment.slotId._id, { status: 'available', appointmentId: null }, { session });

      [newAppointment] = await Appointment.create(
        [
          {
            patientId,
            doctorId: oldAppointment.doctorId._id,
            slotId: newSlotId,
            type: oldAppointment.type,
            notes: oldAppointment.notes,
            status: 'pending',
            consultationFee: oldAppointment.consultationFee,
            rescheduledFrom: oldAppointment._id,
          },
        ],
        { session }
      );

      await Slot.findByIdAndUpdate(newSlotId, { appointmentId: newAppointment._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  return newAppointment;
};
