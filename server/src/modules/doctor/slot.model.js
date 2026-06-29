import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked', 'completed'],
      default: 'available',
    },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  },
  { timestamps: true }
);

slotSchema.index({ doctorId: 1, date: 1, status: 1 });

const Slot = mongoose.model('Slot', slotSchema);
export default Slot;
