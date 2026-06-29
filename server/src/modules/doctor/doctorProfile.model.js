import mongoose from 'mongoose';

const qualificationSchema = new mongoose.Schema(
  { degree: String, institution: String, year: Number },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    qualifications: [qualificationSchema],
    licenseNumber: { type: String, required: true, unique: true },
    licenseDocument: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    experience: { type: Number, default: 0 },
    bio: { type: String, maxlength: 500 },
    consultationFee: { type: Number, default: 0 },
    appointmentType: {
      type: [{ type: String, enum: ['in-person', 'video'] }],
      default: ['in-person'],
    },
    languages: [{ type: String }],
    hospital: {
      name: String,
      address: String,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isAcceptingPatients: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ specialization: 1 });
doctorProfileSchema.index({ 'rating.average': -1 });
doctorProfileSchema.index({ consultationFee: 1 });

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
export default DoctorProfile;
