import DoctorSchedule from './doctorSchedule.model.js';
import Slot from './slot.model.js';
import ApiError from '../../utils/ApiError.js';

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Normalize any date input to UTC midnight — prevents timezone day-flip bugs
const toUTCMidnight = (input) => {
  if (typeof input === 'string') {
    return new Date(input.slice(0, 10) + 'T00:00:00.000Z');
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// Fallback schedule used when a doctor has no DoctorSchedule configured
const DEFAULT_WORK_SCHEDULE = { startTime: '09:00', endTime: '17:00', slotDuration: 10 };

export const generateSlotsForDate = async (doctorId, dateInput) => {
  const date = toUTCMidnight(dateInput);
  const dayOfWeek = date.getUTCDay(); // 0=Sun … 6=Sat

  const schedule = await DoctorSchedule.findOne({ doctorId, dayOfWeek });

  // Explicitly marked unavailable by doctor
  if (schedule && !schedule.isAvailable) return [];

  // No schedule configured at all → default Mon-Sat, closed Sun
  if (!schedule && dayOfWeek === 0) return [];

  const startTime = schedule?.startTime ?? DEFAULT_WORK_SCHEDULE.startTime;
  const endTime   = schedule?.endTime   ?? DEFAULT_WORK_SCHEDULE.endTime;
  const duration  = schedule?.slotDuration ?? DEFAULT_WORK_SCHEDULE.slotDuration;

  // Return existing slots for this date (avoids duplicates)
  const existing = await Slot.find({ doctorId, date });
  if (existing.length > 0) return existing;

  const start = timeToMinutes(startTime);
  const end   = timeToMinutes(endTime);

  const slotsToCreate = [];
  for (let t = start; t + duration <= end; t += duration) {
    slotsToCreate.push({
      doctorId,
      date,
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + duration),
      status: 'available',
    });
  }

  if (!slotsToCreate.length) return [];
  return Slot.insertMany(slotsToCreate);
};

export const generateSlotsForRange = async (doctorId, startDate, endDate) => {
  const start = toUTCMidnight(startDate);
  const end   = toUTCMidnight(endDate);
  const results = [];

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const slots = await generateSlotsForDate(doctorId, new Date(d));
    results.push(...slots);
  }
  return results;
};

export const getAvailableSlots = async (doctorId, dateStr) => {
  const date = toUTCMidnight(dateStr);
  await generateSlotsForDate(doctorId, date);
  return Slot.find({ doctorId, date, status: 'available' }).sort({ startTime: 1 });
};

export const blockSlot = async (doctorId, slotId) => {
  const slot = await Slot.findOne({ _id: slotId, doctorId });
  if (!slot) throw new ApiError(404, 'Slot not found');
  if (slot.status === 'booked') throw new ApiError(400, 'Cannot block a booked slot');
  slot.status = slot.status === 'blocked' ? 'available' : 'blocked';
  await slot.save();
  return slot;
};
