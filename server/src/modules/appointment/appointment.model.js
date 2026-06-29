import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    type: { type: String, enum: ['in-person', 'video'], required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected', 'rescheduled'],
      default: 'pending',
    },
    payment: {
      orderId: String,
      paymentId: String,
      status: { type: String, enum: ['paid'], default: undefined },
    },
    cancellationReason: String,
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    consultationFee: { type: Number, required: true },
    notes: String,
    videoRoomId: String,
    reminderSent: { type: Boolean, default: false },
    confirmedAt: Date,
    cancelledAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ slotId: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
