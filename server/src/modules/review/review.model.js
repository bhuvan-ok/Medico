import mongoose from 'mongoose';
import DoctorProfile from '../doctor/doctorProfile.model.js';

const reviewSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 300 },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ doctorId: 1, rating: -1 });

reviewSchema.post('save', async function () {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { doctorId: this.doctorId, isVerified: true } },
    { $group: { _id: '$doctorId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await DoctorProfile.findOneAndUpdate(
      { userId: this.doctorId },
      {
        $set: {
          'rating.average': Math.round(stats[0].average * 10) / 10,
          'rating.count': stats[0].count,
        },
      }
    );
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
