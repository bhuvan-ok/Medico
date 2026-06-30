import cron from 'node-cron';
import Appointment from '../modules/appointment/appointment.model.js';
import Slot from '../modules/doctor/slot.model.js';
import User from '../modules/user/user.model.js';
import DoctorProfile from '../modules/doctor/doctorProfile.model.js';
import { sendEmail } from './sendEmail.js';
import { appointmentReminderTemplate } from './emailTemplates.js';
import { generateSlotsForDate } from '../modules/doctor/slot.service.js';

const sendAppointmentReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const slots = await Slot.find({ date: { $gte: tomorrow, $lt: dayAfter }, status: 'booked' });
  const slotIds = slots.map((s) => s._id);

  const appointments = await Appointment.find({
    slotId: { $in: slotIds },
    status: 'confirmed',
    reminderSent: false,
  })
    .populate('patientId', 'name email')
    .populate('doctorId', 'name email')
    .populate('slotId', 'date startTime');

  for (const appt of appointments) {
    const dateStr = appt.slotId.date.toDateString();
    const time = appt.slotId.startTime;

    await Promise.allSettled([
      sendEmail({
        to: appt.patientId.email,
        ...appointmentReminderTemplate(appt.patientId.name, appt.doctorId.name, dateStr, time, appt.type),
      }),
      sendEmail({
        to: appt.doctorId.email,
        ...appointmentReminderTemplate(`Dr. ${appt.doctorId.name}`, appt.patientId.name, dateStr, time, appt.type),
      }),
    ]);

    appt.reminderSent = true;
    await appt.save();
  }
};

const generateNextDaySlots = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const profiles = await DoctorProfile.find({ isVerified: true, isAcceptingPatients: true }).select('userId');

  for (const profile of profiles) {
    await generateSlotsForDate(profile.userId, tomorrow).catch(() => {});
  }
};

export const initCronJobs = () => {
  // Every day at 8am — send 24h reminders
  cron.schedule('0 8 * * *', sendAppointmentReminders);

  // Every day at midnight — pre-generate next day slots
  cron.schedule('0 0 * * *', generateNextDaySlots);
};
