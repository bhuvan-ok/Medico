import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import DoctorProfile from '../doctor/doctorProfile.model.js';
import Slot from '../doctor/slot.model.js';
import { bookAppointment } from '../appointment/appointment.service.js';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async ({ slotId, doctorId, type }) => {
  const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
  if (!doctorProfile) throw new ApiError(404, 'Doctor not found');
  if (!doctorProfile.isVerified) throw new ApiError(400, 'Doctor is not verified');
  if (!doctorProfile.isAcceptingPatients) throw new ApiError(400, 'Doctor is not accepting patients');
  if (!doctorProfile.appointmentType.includes(type)) {
    throw new ApiError(400, `Doctor does not offer ${type} appointments`);
  }

  const slot = await Slot.findOne({ _id: slotId, doctorId, status: 'available' });
  if (!slot) throw new ApiError(409, 'Slot is no longer available');

  const amountInPaise = Math.round(doctorProfile.consultationFee * 100);

  // Razorpay receipt max = 40 chars. Use last 8 of slotId + base36 timestamp = ~20 chars.
  const receipt = `mb_${slotId.toString().slice(-8)}_${Date.now().toString(36)}`;

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: { doctorId: doctorId.toString(), slotId: slotId.toString(), type },
    });
  } catch (err) {
    const msg = err?.error?.description || err?.message || 'Razorpay order creation failed';
    throw new ApiError(502, msg);
  }

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: env.RAZORPAY_KEY_ID,
  };
};

export const verifyAndBook = async (patientId, {
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  slotId,
  doctorId,
  type,
  notes,
}) => {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, 'Payment verification failed — invalid signature');
  }

  const appointment = await bookAppointment(
    patientId,
    { slotId, doctorId, type, notes },
    { orderId: razorpayOrderId, paymentId: razorpayPaymentId }
  );

  return appointment;
};
